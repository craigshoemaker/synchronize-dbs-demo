let localDB;

const api = {

    init: async () => {

        const databaseName = 'people';

        localDB = new PouchDB(databaseName);
        await localDB.destroy();

        localDB = new PouchDB(databaseName);
        console.log(localDB);

        // api.seed();
    },

    add: async () => {
        const person = {
            _id: 'craigshoemaker',
            name: 'Craig Shoemaker',
            twitter: 'craigshoemaker'
        };

        const response = await localDB.put(person);
        console.log(response);
    },

    get: async () => {     
        const person = await localDB.get('craigshoemaker');
        console.log(person);
    },

    update: async() => {
        const person = await localDB.get('craigshoemaker');
        console.log(person);

        person.github = 'craigshoemaker';

        const response = await localDB.put(person);
        console.log(response);
    },

    remove: async () => {
        const person = await localDB.get('craigshoemaker');
        console.log(person);

        const response = await localDB.remove(person);
        console.log(response);
    },

    getAll: async () => {
        const options = {
            include_docs: true,
            conflicts: true
        };

        const response = await localDB.allDocs(options);
        console.log(response);

        return response.rows;
    },

    syncer: {},

    sync: (live = true, retry = true) => {
        const options = {
            live: live,
            retry: retry
        };

        api.syncer = localDB.sync(remoteDB, options);
        syncer.on('change', e => console.log('change', e));
        syncer.on('paused', e => console.log('paused', e));
        syncer.on('active', e => console.log('active', e));
        syncer.on('denied', e => console.log('denied', e));
        syncer.on('complete', e => console.log('complete', e));
        syncer.on('error', e => console.log('error', e));

        // syncer.cancel();
    },

    resolveImmediateConflict: async (selectedSource) => {

        const record = /database/i.test(selectedSource) ?
                        databaseRecord : 
                        incomingRecord;

        const person = localDB.get(record.id);
        person.title = record.name;

        const response = await localDB.put(person);
    },

    resolveEventualConflict: async (id, winningRevId) => {
        const options = { conflicts: true };

        // get item with conflicts
        const item = await localDB.get(id, options);

        // filter out wanted item
        let revIds = item._conflicts;
        revIds.push(item._rev);
        revIds = revIds.filter(conflictId => conflictId !== winningRevId);

        // create collection of items to delete
        const conflicts = revIds.map(rev => {
            return {
                _id: item._id,
                _rev: rev,
                _deleted: true
            };
        });

        const response = await localDB.bulkDocs(conflicts);
    },

    seed: async () => {
        let counter = 0;

        await localDB.bulkDocs([
            {
                _id: 'jimnasium',
                name: 'Jim Nasium'
            },
            {
                _id: 'ottopartz',
                name: 'Otto Partz'
            },
            {
                _id: 'dinahmite',
                name: 'Dinah Mite'
            }
        ]);

        console.log('The local database is seeded');
    }
};