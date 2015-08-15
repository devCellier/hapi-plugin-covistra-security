var path = require('path');

module.exports = {
    'admin.users': {
        url: 'users',
        controller: 'AdminUsersCtrl',
        templateUrl: 'users/home',
        resolve: {
            users: function(CMBF) {
                return CMBF.resource('Users', { offline: false, cache: true}).list();
            }
        }
    }
};
