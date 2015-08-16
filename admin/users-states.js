var path = require('path');

module.exports = {
    'admin.users': {
        url: 'admin/users',
        controller: 'AdminUsersCtrl',
        templateUrl: 'users/home',
        resolve: {
            users: function(CMBF) {
                return CMBF.resource('Users', { offline: false, cache: true}).list();
            }
        }
    }
};
