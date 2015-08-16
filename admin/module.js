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
    controllers: {
        AdminUsersCtrl: require('./users-ctrl')
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
    views: {
        "users/home": path.resolve(__dirname, "templates/users/home.html")
    }
};
