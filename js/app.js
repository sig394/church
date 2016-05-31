angular.module(
		'Contabilidad',
		[ 'ionic', 'n3-line-chart', 'flexcalendar', 'pascalprecht.translate',
				'ionic-datepicker', 'ionic-timepicker',
				'Contabilidad.services', 'Contabilidad.controllers',
				'Contabilidad.filters','angular-jwt'])

.run(
		function($ionicPlatform, $rootScope, $translate, Config, Incomes,Outcomes,$location) {
			localStorage.clear();	
			if(localStorage.getItem('id_token')){
				Incomes.initialize().then(function(promise) {});
				Outcomes.initialize().then(function(promise) {});
			}

			$rootScope.config = Config.all();
			if ($rootScope.config.language == 'es'
					|| $rootScope.config.language == 'en')
				$translate.use($rootScope.config.language);
			else
				$translate.use('en');
			$ionicPlatform.ready(function() {
				if (window.cordova && window.cordova.plugins.Keyboard) {
					cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
					cordova.plugins.Keyboard.disableScroll(true);

				}
				if (window.StatusBar) {
					StatusBar.styleDefault();
				}
			});
			$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
				if(localStorage.getItem('id_token')==null){
					$location.path('/home');
				}
			});
		})

.config(
		function($provide, $stateProvider, $ionicConfigProvider,
				$urlRouterProvider, $translateProvider,$httpProvider,jwtInterceptorProvider) {

			jwtInterceptorProvider.tokenGetter = ['Sessions', function(Sessions) {
    			return localStorage.getItem('id_token');
  			}];
  			$httpProvider.interceptors.push('jwtInterceptor');

			$provide.decorator('$locale', [ '$delegate', function($delegate) {
				if ($delegate.id == 'en-us') {
					$delegate.NUMBER_FORMATS.PATTERNS[1].negPre = '-\u00A4';
					$delegate.NUMBER_FORMATS.PATTERNS[1].negSuf = '';
				}
				return $delegate;
			} ]);
			$ionicConfigProvider.navBar.alignTitle("center");
			//$ionicConfigProvider.views.maxCache(0);
			$translateProvider.useStaticFilesLoader({
				prefix : 'locale/locale-',
				suffix : '.json'
			});
			$translateProvider.useMessageFormatInterpolation();
			$translateProvider.determinePreferredLanguage(function() {
				return navigator.language.substring(0, 2)
			}).fallbackLanguage('es');
			$stateProvider

			.state('app', {
				url : '/app',
				abstract : true,
				templateUrl : 'templates/menu.html',
				controller : 'AppCtrl'
			})

			.state('app.home', {
				url : '/home',
                                cache: false,
				views : {
					'menuContent' : {
						templateUrl : 'templates/home.html',
						controller : 'HomeCtrl'
					}
				}
			})

			.state('app.income', {
				url : '/income',
				views : {
					'menuContent' : {
						templateUrl : 'templates/income.html',
						controller : 'IncomesCtrl'
					}
				}
			})

			.state('app.newIncome', {
				url : '/income/newIncome',
				views : {
					'menuContent' : {
						templateUrl : 'templates/newIncome.html',
						controller : 'NewIncomeCtrl'
					}
				}
			})

			.state('app.editIncome', {
				url : '/income/editIncome/:incomeId',
				views : {
					'menuContent' : {
						templateUrl : 'templates/newIncome.html',
						controller : 'EditIncomeCtrl'
					}
				}
			})

			.state('app.newDailyIncome', {
				url : '/income/newDailyIncome',
				views : {
					'menuContent' : {
						templateUrl : 'templates/newDailyIncome.html',
						controller : 'NewDailyIncomeCtrl'
					}
				}
			})

			.state('app.newDailyIncomeCalendar', {
				url : '/income/newDailyIncome/:date',
				views : {
					'menuContent' : {
						templateUrl : 'templates/newDailyIncome.html',
						controller : 'NewDailyIncomeCtrl'
					}
				}
			})

			.state('app.outcome', {
				url : '/outcome',
				views : {
					'menuContent' : {
						templateUrl : 'templates/outcome.html',
						controller : 'OutcomesCtrl'
					}
				}
			})

			.state('app.newOutcome', {
				url : '/outcome/newOutcome',
				views : {
					'menuContent' : {
						templateUrl : 'templates/newOutcome.html',
						controller : 'NewOutcomeCtrl'
					}
				}
			})

			.state('app.editOutcome', {
				url : '/outcome/editOutcome/:outcomeId',
				views : {
					'menuContent' : {
						templateUrl : 'templates/newOutcome.html',
						controller : 'EditOutcomeCtrl'
					}
				}
			})

			.state('app.newDailyOutcome', {
				url : '/outcome/newDailyOutcome',
				views : {
					'menuContent' : {
						templateUrl : 'templates/newDailyOutcome.html',
						controller : 'NewDailyOutcomeCtrl'
					}
				}
			})

			.state('app.newDailyOutcomeCalendar', {
				url : '/outcome/newDailyOutcome/:date',
				views : {
					'menuContent' : {
						templateUrl : 'templates/newDailyOutcome.html',
						controller : 'NewDailyOutcomeCtrl'
					}
				}
			})

			.state('app.categories', {
				url : '/categories',
				views : {
					'menuContent' : {
						templateUrl : 'templates/categories.html',
						controller : 'CategoriesCtrl'
					}
				}
			})

			.state('app.newCategory', {
				url : '/categories/newCategory',
				views : {
					'menuContent' : {
						templateUrl : 'templates/newCategory.html',
						controller : 'NewCategoryCtrl'
					}
				}
			})

			.state('app.editCategory', {
				url : '/categories/editCategory/:categoryId',
				views : {
					'menuContent' : {
						templateUrl : 'templates/newCategory.html',
						controller : 'EditCategoryCtrl'
					}
				}
			})

			.state('app.history', {
				url : '/history',
				views : {
					'menuContent' : {
						templateUrl : 'templates/history.html',
						controller : 'HistoryCtrl'
					}
				}
			})

			.state('app.configuration', {
				url : '/configuration',
				views : {
					'menuContent' : {
						templateUrl : 'templates/configuration.html',
						controller : 'ConfigurationCtrl'
					}
				}
			})

			.state('app.calendar', {
				url : '/calendar',
				views : {
					'menuContent' : {
						templateUrl : 'templates/calendar.html',
						controller : 'CalendarCtrl'
					}
				}
			})

			.state('app.reset', {
				url : '/reset',
				views : {
					'menuContent' : {
						templateUrl : 'templates/reset.html',
						controller : 'ResetCtrl'
					}
				}
			})

			.state('app.help', {
				url : '/help',
				views : {
					'menuContent' : {
						templateUrl : 'templates/help.html',
						controller : 'HelpCtrl'
					}
				}
			})

			.state('app.helpDetail', {
				url : '/help/:name/:index',
				views : {
					'menuContent' : {
						templateUrl : 'templates/helpDetail.html',
						controller : 'HelpDetailCtrl'
					}
				}
			});
			$urlRouterProvider.otherwise('/app/home');
		});
