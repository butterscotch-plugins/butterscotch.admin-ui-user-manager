/*jslint node: true, plusplus: true */
/*global module, require*/
/* jshint strict: true */
'use strict';
var flash = require('connect-flash')
var bodyParser = require('body-parser')
var logger = require('winston')
module.exports = {

	init: function (adminContext, adminPermissions, adminUserSchema, self) {
		adminContext.wrap('addToRes', function (prev, req, res) {
			prev(req, res);
			var link = {
				url: '/admin/users',
				text: 'Manage User'
			};
			if (adminPermissions.isAuthorized(req, 'view_user')) {
				res.locals.navigationMenu.push(link);
			}
		});
		adminPermissions.addPermission('view_user', 'Can view the list of current users');
		adminPermissions.addPermission('add_user', 'Can add new users with limited permissions');
		adminPermissions.addPermission('delete_user', 'Can remove users');
		self.register({
			name: 'modifyAllUsersDBQuery',
			initialValue: function (query, urlParameters) {
				query = query.lean().sort('-_id');
				if (urlParameters.start) {
					query = query.skip(urlParameters.start);
				}
				if (urlParameters.limit) {
					query = query.limit(urlParameters.start);
				} else {
					query = query.limit(10);
				}
				return query;
			}
		});
	},
	execute: function (config, adminPermissions, adminContext, authenticateAdminUi, adminUserSchema, adminApp, self) {
		var pluginName = config.pluginName;
		adminApp.use('/users', bodyParser.json());		adminApp.use('/users', bodyParser.urlencoded({
			extended: true
		}));
		adminApp.use('/users', flash());
		adminApp.get('/users',
			authenticateAdminUi.redirectAdminIfNotLogged,
			adminContext.addContext,
			renderIndexPage);
		adminApp.get('/users/create',
			authenticateAdminUi.redirectAdminIfNotLogged,
			adminContext.addContext,
			function (req, res, next) {
				res.render('signup');
			});
		adminApp.get('/users/api',
			authenticateAdminUi.forbidResponseIfNotLogged,
			function (req, res, next) {
				var query = adminUserSchema.getAdminUserSchemaModel().find({});
				query = self.modifyAllUsersDBQuery(query, req.query);
				query.exec().then(function (users) {
					res.send(users);
				});
			});
		adminApp.post('/users/create',
			authenticateAdminUi.redirectAdminIfNotLogged,
			adminContext.addContext,
			function (req, res, next) {
				var postParameters,
					userData,
					isValid,
					AdminUsersModel,
					newRecord;
				postParameters = req.body;
				adminUserSchema.insertUser(postParameters)
					.then(function (user) {
						req.flash('message', 'User Created Successfully');
						res.redirect('/admin/users');
					});
			});
		adminApp.post('/users/api/create',
			authenticateAdminUi.forbidResponseIfNotLogged,
			function (req, res, next) {
				var postParameters,
					userData,
					isValid,
					AdminUsersModel,
					newRecord;
				postParameters = req.body; //email, password, name, image,bio
				userData = self.createUserDataFromParameters(postParameters);
				self.modifyUserDataBeforeRegister(userData);
				AdminUsersModel = adminUserSchema.getAdminUserSchemaModel();
				newRecord = new AdminUsersModel(userData);
				newRecord.save()
					.then(function (user) {
						res.send(user);
					})
					.catch(function (er) {
						return next(er);
					});
			});
		adminApp.delete('/users/delete/api/',
			authenticateAdminUi.forbidResponseIfNotLogged,
			function (req, res, next) {
				var deleteParameters,
					AdminUsersModel,
					newRecord,
					id;
				deleteParameters = req.body; //email, password, name, image,bio
				id = deleteParameters.userId;
				AdminUsersModel = adminUserSchema.getAdminUserSchemaModel();
				AdminUsersModel.remove({
					'_id': id
				})
					.then(function () {
						res.send('User with id ' + id + ' has been successfully deleted');
					})
					.catch(function (err) {
						logger.error(err);
						res.send('Some unfortunate error has occured');
					});
				newRecord.save().then(function (user) {
					req.flash('message', 'User Created Successfully');
					res.render('index', {
						message: req.flash('message')
					});
				});
			});
		function renderIndexPage(req, res, next) {
			var query = adminUserSchema.getAdminUserSchemaModel().find({});
			query = self.modifyAllUsersDBQuery(query, req.query);
			query.exec().then(function (users) {
				res.locals.users = users;
				res.render('index', {
					message: req.flash('message')
				});
			});
		}
	}

};
