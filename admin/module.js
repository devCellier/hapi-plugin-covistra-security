var path = require('path');

module.exports = {
    menus:[{
        name:'Security',
        items:[{
            label:'Manage Users',
            state:'admin.users'
        }]
    }],
    states: require('./users-states'),
    controllers:{
        UsersCtrl: require('./users-ctrl')
    },
    resources: {
        Users: {
            endpoint: 'users/{username}',
            methods: '*'
        }
    },
    services:{
        CMBF: 'CMBF'
    },
    templates:{
        users: {
            home: path.resolve(__dirname, "templates/users/home.html")
        }
    }
};
