const db = {
    local: new PouchDB('todos'),
    remote: new PouchDB('http://localhost:5984/todos', {
        skipSetup: true,
        auth: {
            username: 'smoothwookie',
            password: 'ThisIsMyPassword!',
        },
    }),
    _sync: {},
    listenForChanges() {
        this.local.changes({ since: 'now', live: true})
            .on('change', app.getAll)
            .on('error', console.log);

        this.remote.changes({ since: 'now', live: true})
            .on('change', app.getAll)
            .on('error', console.log);
    },
    synchronize(live = false, retry = true) {
        const options = {
            live: live,
            retry: retry
        };

        this._sync = this.local.sync(this.remote, options);

        this._sync.on('change', e => console.log('change', e));
        this._sync.on('paused', e => console.log('paused', e));
        this._sync.on('active', e => console.log('active', e));
        this._sync.on('denied', e => console.log('denied', e));
        this._sync.on('complete', e => console.log('complete', e));
        this._sync.on('error', e => console.log('error', e));
    },
    cancel() {
        this._sync.cancel();
    }
};

const app = new Vue({
    el: '#app',
    data() {
        return {
            localTodos: [],
            remoteTodos: [],
            localTitle: '',
            remoteTitle: '',
            isLiveSyncing: false
        }
    },
    created() {
        this.getAll();
    },
    methods: {

        async add(location) {
            const title = this.localTitle.length > 0 ? 
                        this.localTitle : 
                        this.remoteTitle;

            const todo = {
                _id: (new Date()).toISOString(),
                title: title
            };
            const response = await db[location].put(todo);
            console.log(response);

            this.localTitle = '';
            this.remoteTitle = '';
        },

        async get(location, _id) {
            return await db[location].get(_id);
        },

        // async update(location, item) {
        //     const todo = await this.get(location, item._id);
        //     todo.title = item.title;
        //     const response = await db[location].put(todo);
        //     return response;
        // },

        async remove(location, item) {
            const todo = await this.get(location, item._id);
            return await db[location].remove(todo);
        },
        
        async getAll() {
            const options = {
                include_docs: true,
                conflicts: true
            };
    
            const localData = await db.local.allDocs(options);
            this.localTodos = localData.rows;

            const remoteData = await db.remote.allDocs(options);
            this.remoteTodos = remoteData.rows;
        },

        manualSync() {
            db.synchronize();
        },

        liveSync() {
            db.synchronize(true);
            this.isLiveSyncing = true;
        },

        cancel() {
            db.cancel();
            this.isLiveSyncing = false;
        }
    }
});

db.listenForChanges();

console.log(db.remote);