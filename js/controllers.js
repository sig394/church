angular
		.module('Contabilidad.controllers', [])

		.controller('AppCtrl', function($scope, ViewsButton) {
			$scope.view = null;
			$scope.rightButtonAction = function() {
				alert("hola");
			}
			$scope.showRightButton = function() {
				$scope.view = ViewsButton.get();
				if ($scope.view == null)
					return false;
				else
					return $scope.view.hasRightButton;
			}
			$scope.isLogged = function(){
				return (localStorage.getItem('session')==null) ? false : true;
			}
		})

		.controller(
				'HomeCtrl',
				function($scope, Incomes, Outcomes,Categories,$ionicModal,$http,$state) {

					$scope.isLogged =  (localStorage.getItem('id_token')) ? true : false;
					$scope.formData = {};
					function init() {
						
						if(!$scope.isLogged){
							$scope.incomes = [];
							$scope.incomeTotals = 0;
							$scope.outcomes = [];
							$scope.outcomeTotals = 0;
							$scope.lastMonthValue = 0;

							$ionicModal.fromTemplateUrl('templates/login.html', {
								scope: $scope,
								animation: 'slide-in-up',
								backdropClickToClose :false
							}).then(function(modal) {
								$scope.modal = modal;
								$scope.openModal();
							});

						}else{
							Categories.initialize().then(function(promise) {
							  Incomes.initialize().then(function(promise) {
								Outcomes.initialize().then(function(promise) {
									$scope.incomes = Incomes.allActive();
									$scope.incomeTotals = Incomes.totalsActualMonth();
									$scope.outcomes = Outcomes.allActive();
									$scope.outcomeTotals = Outcomes.totalsActualMonth();
									$scope.lastMonthValue = lastMonth();			
								});
							  });
							});
							
						}
					}
					function lastMonth() {
						// var outcomesAmount =
						// Outcomes.totalsPreviousMonth().amount;
						// var incomesAmount =
						// Incomes.totalsPreviousMonth().amount;
						var outcomesAmount = Outcomes.totalsAllButActualMonth().amount;
						var incomesAmount = Incomes.totalsAllButActualMonth().amount;
						return incomesAmount - outcomesAmount  + $scope.config.initial;
					}
					$scope.fullTotal = function() {
						return ($scope.lastMonthValue + ($scope.incomeTotals.amount))
								- $scope.outcomeTotals.amount;
					}
					
					

					$scope.openModal = function() {
				    	$scope.modal.show();
				   	};

				   	$scope.closeModal = function() {
				        $scope.modal.hide();
				    };

				    $scope.$on('$destroy', function() {
				        $scope.modal.remove();
				    });

					$scope.login = function(){
						if($scope.formData.username!="" && $scope.formData.password!=""){
							var data = {email: $scope.formData.username, password: $scope.formData.password};
							$http.post('http://www.iblhos.com.ar/back/finanzas/api/public/login', data)
					            .success(function (data, status, headers, config) {
					           		if(status==200){
					            		$scope.isLogged = true;
						           		localStorage.setItem('id_token', data.token);
						           		$scope.closeModal();
						           		init();
					            	}					            })
					            .error(function (data, status, header, config) {
					        	});
						}
					};	

					$scope.logout = function(){

					}			    


					init();
					//$scope.$on('$ionicView.enter', init);
				})

		.controller('IncomesCtrl', function($scope, $incomeTypes, Incomes,$state) {
			function init() {
				Incomes.initialize().then(function(promise) {
    				$scope.incomeTypes = $incomeTypes;
    				$scope.incomes = Incomes.allActive();
    				$scope.totals = Incomes.totalsActualMonthWithType();
    				console.log($scope.totals);
					$scope.checked = {
						0 : {},
						1 : {}
					};
					initChecks();
  				});			
			}
			function initChecks() {
				for (var i = 0; i < $scope.incomes.length; i++) {
					$scope.checked[$scope.incomes[i].id] = true;
				}
			}
			$scope.incomeTotal = function(id) {
				return Incomes.totalAmount(id, null);
			}
			$scope.changeTotals = function(id, type, realId) {
				if ($scope.checked[realId]) {
					$scope.totals[type].amount += $scope.incomeTotal(realId);
					$scope.totals[type].budget += Incomes.get(realId).budget;
				} else {
					$scope.totals[type].amount -= $scope.incomeTotal(realId);
					$scope.totals[type].budget -= Incomes.get(realId).budget;
				}
			}
			init();
			$scope.$on('$ionicView.enter', init);
		})

		.controller(
				'NewDailyIncomeCtrl',
				function($scope, $ionicPopup, $ionicHistory, $translate,
						$incomeTypes, $stateParams, Incomes) {
					function init() {
						$scope.incomeTypes = $incomeTypes;
						$scope.incomes = Incomes.allActive();
						$scope.currentDate = ($stateParams.date != undefined ? new Date(
								$stateParams.date)
								: new Date());
						$scope.datePickerCallback = function(val) {
							if (typeof (val) === 'undefined') {
								console.log('Date not selected');
							} else {
								console.log('Selected date is : ', val);
								$scope.currentDate = val;
							}
						};
						$scope.newIncome = {
							date : new Date(),
							type : 0,
							amount : 0,
							incomeParent : null
						};
					}
					function showAlert(button) {
						var alertPopup = $ionicPopup.alert({
							templateUrl : "donePopupDailyIncome.html",
							okText : button,
							scope : $scope
						});
						alertPopup.then(function(res) {
							$ionicHistory.goBack();
						});
					}
					$scope.changeType = function() {
						$scope.newIncome.incomeParent = null;
					}
					$scope.saveIncome = function() {
						$scope.newIncome.date = $scope.currentDate.toJSON();

						Incomes.addDaily($scope.newIncome.incomeParent.id,$scope.newIncome).then(function(promise){
							$translate('VIEWS.NEW_OUTCOME.BUTTON').then(
								function(trans) {
									Incomes.initialize().then(function(promise){
										showAlert(trans);	
									});
								});
						});
					}
					init();
					$scope.$on('$ionicView.enter', init);
				})

		.controller(
				'NewIncomeCtrl',
				function($scope, $ionicPopup, $ionicHistory, $translate,
						$incomeTypes, Incomes) {
					function init() {
						$scope.create = true;
						$scope.title = 'VIEWS.NEW_INCOME.TITLE';
						$scope.incomeTypes = $incomeTypes;
						$scope.currentDate = new Date();
						$scope.newIncome = {
							name : "",
							type : 0,
							amount : 0,
							budget : 0
						};
					}
					function showAlert(button) {
						var alertPopup = $ionicPopup.alert({
							templateUrl : "donePopupIncome.html",
							okText : button,
							scope : $scope
						});
						alertPopup.then(function(res) {
							$ionicHistory.goBack();
						});
					}
					$scope.exists = function() {
						return Incomes.exists($scope.newIncome.name);
					}
					$scope.saveIncome = function() {
						$scope.newIncome.dailyIncomes = [];

						Incomes.add($scope.newIncome).then(function(promise){
							$translate('VIEWS.NEW_OUTCOME.BUTTON').then(
								function(trans) {
									Incomes.initialize().then(function(promise){
										showAlert(trans);	
									});
								});
						});
					}
					init();
					$scope.$on('$ionicView.enter', init);
				})

		.controller(
				'EditIncomeCtrl',
				function($scope, $ionicPopup, $ionicHistory, $translate,
						$incomeTypes, $stateParams, Incomes) {
					function init() {
						$scope.create = false;
						$scope.title = 'VIEWS.EDIT_INCOME.TITLE';
						$scope.incomeTypes = $incomeTypes;
						$scope.currentDate = new Date();
						$scope.newIncome = Incomes.get($stateParams.incomeId);
					}
					function showConfirm(title, body, buttonOk, buttonCancel) {
						var confirmPopup = $ionicPopup.confirm({
							title : title,
							template : body,
							cancelText : buttonCancel,
							cancelType : 'button-outline button-stable',
							okText : buttonOk,
							okType : 'button-assertive'
						});
						confirmPopup.then(function(res) {
							if (res) {
								Incomes.erase($stateParams.incomeId);
								$ionicHistory.goBack();
								console.log('You are sure');
							} else {
								console.log('You are not sure');
							}
						});
					}
					function showAlert(button) {
						var alertPopup = $ionicPopup.alert({
							templateUrl : "donePopupIncomeEdit.html",
							okText : button,
							scope : $scope
						});
						alertPopup.then(function(res) {
							$ionicHistory.goBack();
						});
					}
					$scope.deleteIncome = function() {
						$translate(
								[
										'VIEWS.EDIT_INCOME.POPUP_DELETE_TITLE',
										'VIEWS.EDIT_INCOME.POPUP_DELETE_BODY',
										'VIEWS.EDIT_INCOME.POPUP_DELETE_ACCEPT',
										'VIEWS.EDIT_INCOME.POPUP_DELETE_CANCEL' ])
								.then(
										function(trans) {
											showConfirm(
													trans['VIEWS.EDIT_INCOME.POPUP_DELETE_TITLE'],
													trans['VIEWS.EDIT_INCOME.POPUP_DELETE_BODY'],
													trans['VIEWS.EDIT_INCOME.POPUP_DELETE_ACCEPT'],
													trans['VIEWS.EDIT_INCOME.POPUP_DELETE_CANCEL']);
										});
					}
					$scope.editIncome = function() {
						Incomes.edit($stateParams.incomeId, $scope.newIncome);
						$translate('VIEWS.NEW_OUTCOME.BUTTON').then(
								function(trans) {
									showAlert(trans);
								});
					}
					init();
					$scope.$on('$ionicView.enter', init);
				})

		.controller('OutcomesCtrl', function($scope, Categories, Outcomes) {
			function init() {
				Outcomes.initialize().then(function(promise) {
    				//scope.revenues = promise;
    				$scope.outcomes = Outcomes.allActive();
					$scope.totals = Outcomes.totalsActualMonth();
					console.log("ACA");
					console.log($scope.totals);
					$scope.checked = {};
					initChecks();
  				});
				
			}
			function initChecks() {
				for (var i = 0; i < $scope.outcomes.length; i++) {
					$scope.checked[i] = true;
				}
			}
			$scope.outcomeTotal = function(id) {
				return Outcomes.totalAmount(id, null);
			}
			$scope.getCategory = function(id) {
				return Categories.get(id).name;
			}
			$scope.changeTotals = function(id, realId) {
				if ($scope.checked[id]) {
					$scope.totals.amount += $scope.outcomeTotal(realId);
					$scope.totals.budget += $scope.outcomes[id].budget;
				} else {
					$scope.totals.amount -= $scope.outcomeTotal(realId);
					$scope.totals.budget -= $scope.outcomes[id].budget;
				}
			}
			init();
			$scope.$on('$ionicView.enter', init);
		})

		.controller(
				'NewDailyOutcomeCtrl',
				function($scope, $ionicPopup, $ionicHistory, $translate,
						$stateParams, Outcomes) {
					function init() {
						$scope.outcomes = Outcomes.allActive();
						$scope.currentDate = ($stateParams.date != undefined ? new Date(
								$stateParams.date)
								: new Date());
						$scope.datePickerCallback = function(val) {
							if (typeof (val) === 'undefined') {
								console.log('Date not selected');
							} else {
								console.log('Selected date is : ', val);
								$scope.currentDate = val;
							}
						};
						$scope.newOutcome = {
							date : new Date(),
							amount : 0,
							outcomeParent : $scope.outcomes[0]
						};
					}
					function showAlert(button) {
						var alertPopup = $ionicPopup.alert({
							templateUrl : "donePopupDailyOutcome.html",
							okText : button,
							scope : $scope
						});
						alertPopup.then(function(res) {
							$ionicHistory.goBack();
						});
					}
					$scope.saveOutcome = function() {
						$scope.newOutcome.date = $scope.currentDate.toJSON();
						Outcomes.addDaily($scope.newOutcome.outcomeParent.id,$scope.newOutcome).then(function(promise){
							$translate('VIEWS.NEW_OUTCOME.BUTTON').then(
								function(trans) {
									Outcomes.initialize().then(function(promise){
										showAlert(trans);	
									});
								});
						});
						
					}
					init();
					$scope.$on('$ionicView.enter', init);
				})

		.controller(
				'NewOutcomeCtrl',
				function($scope, $ionicPopup, $ionicHistory, $translate,
						Outcomes, Categories) {
					function init() {
						Categories.initialize().then(function(promise) {
							$scope.create = true;
							$scope.title = 'VIEWS.NEW_OUTCOME.TITLE';
							$scope.categories = Categories.all();
							$scope.currentDate = new Date();
							$scope.newOutcome = {
								name : "",
								category : ($scope.categories.length ? $scope.categories[0].id : null),
								amount : 0,
								budget : 0
							};
						});
					}
					function showAlert(button) {
						var alertPopup = $ionicPopup.alert({
							templateUrl : "donePopupOutcome.html",
							okText : button,
							scope : $scope
						});
						alertPopup.then(function(res) {
							$ionicHistory.goBack();
						});
					}
					$scope.exists = function() {
						return Outcomes.exists($scope.newOutcome.name);
					}
					$scope.saveOutcome = function() {
						$scope.newOutcome.dailyOutcomes = [];
						Outcomes.add($scope.newOutcome).then(function(promise){
							$translate('VIEWS.NEW_OUTCOME.BUTTON').then(
								function(trans) {
									Outcomes.initialize().then(function(promise){
										showAlert(trans);	
									});
								});
						});
					}
					init();
					$scope.$on('$ionicView.enter', init);
				})

		.controller(
				'EditOutcomeCtrl',
				function($scope, $ionicPopup, $ionicHistory, $translate,
						$stateParams, Outcomes, Categories) {
					function init() {
						$scope.create = false;
						$scope.title = 'VIEWS.EDIT_OUTCOME.TITLE';
						$scope.categories = Categories.all();
						$scope.currentDate = new Date();
						$scope.newOutcome = Outcomes
								.get($stateParams.outcomeId);
					}
					function showConfirm(title, body, buttonOk, buttonCancel) {
						var confirmPopup = $ionicPopup.confirm({
							title : title,
							template : body,
							cancelText : buttonCancel,
							cancelType : 'button-outline button-stable',
							okText : buttonOk,
							okType : 'button-assertive'
						});
						confirmPopup.then(function(res) {
							if (res) {
								Outcomes.erase($stateParams.outcomeId);
								$ionicHistory.goBack();
								console.log('You are sure');
							} else {
								console.log('You are not sure');
							}
						});
					}
					function showAlert(button) {
						var alertPopup = $ionicPopup.alert({
							templateUrl : "donePopupOutcomeEdit.html",
							okText : button,
							scope : $scope
						});
						alertPopup.then(function(res) {
							$ionicHistory.goBack();
						});
					}
					$scope.deleteOutcome = function() {
						$translate(
								[
										'VIEWS.EDIT_OUTCOME.POPUP_DELETE_TITLE',
										'VIEWS.EDIT_OUTCOME.POPUP_DELETE_BODY',
										'VIEWS.EDIT_OUTCOME.POPUP_DELETE_ACCEPT',
										'VIEWS.EDIT_OUTCOME.POPUP_DELETE_CANCEL' ])
								.then(
										function(trans) {
											showConfirm(
													trans['VIEWS.EDIT_OUTCOME.POPUP_DELETE_TITLE'],
													trans['VIEWS.EDIT_OUTCOME.POPUP_DELETE_BODY'],
													trans['VIEWS.EDIT_OUTCOME.POPUP_DELETE_ACCEPT'],
													trans['VIEWS.EDIT_OUTCOME.POPUP_DELETE_CANCEL']);
										});
					}
					$scope.editOutcome = function() {
						Outcomes
								.edit($stateParams.outcomeId, $scope.newOutcome);
						$translate('VIEWS.NEW_OUTCOME.BUTTON').then(
								function(trans) {
									showAlert(trans);
								});
					}
					init();
					$scope.$on('$ionicView.enter', init);
				})

		.controller('CategoriesCtrl', function($scope, Categories, Outcomes) {
			function init() {
				console.log("PASO");
				Categories.initialize().then(function(promise) {
					$scope.totalsOutcomes = Outcomes.totalsActualMonth();
					$scope.categories = Categories.all();
					$scope.totals = Categories.totals();
					$scope.checked = {};
					initChecks();
					$scope.tamount = totalAmount();
					$scope.tbudget = totalBudget();
				});
			}
			function initChecks() {
				for (var i = 0; i < $scope.categories.length; i++) {
					$scope.checked[i] = true;
				}
			}
			function totalAmount() {
				var total = 0;
				for (var i = 0; i < $scope.categories.length; i++) {
					if ($scope.checked[i]) {
						total += $scope.totals[$scope.categories[i].id].amount;
					}
				}
				return total;
			}
			function totalBudget(){
				var total = 0;
				for (var i = 0; i < $scope.categories.length; i++) {
					if ($scope.checked[i]) {
						total += $scope.totals[$scope.categories[i].id].budget;
					}
				}
				return total;
			}
			init();
			$scope.$on('$ionicView.enter', init);
		})

		.controller(
				'NewCategoryCtrl',
				function($scope, $ionicPopup, $ionicHistory, $translate,
						Categories,$state) {
					function init() {
						$scope.create = true;
						$scope.title = 'VIEWS.NEW_CATEGORY.TITLE';
						$scope.newCategory = {
							name : ""
						};
					}
					function showAlert(button) {
						var alertPopup = $ionicPopup.alert({
							templateUrl : "donePopup.html",
							okText : button,
							scope : $scope
						});
						alertPopup.then(function(res) {
							$state.go('app.categories', {}, {reload: true});
						});
					}
					$scope.exists = function() {
						return Categories.exists($scope.newCategory.name);
					}
					$scope.saveCategory = function() {
						Categories.add($scope.newCategory.name).then(function(promise) {
								$translate('VIEWS.NEW_CATEGORY.BUTTON').then(
									function(trans) {
										Categories.initialize().then(function(promise){
											showAlert(trans);	
										});
										
								});
							
						});
					}
					init();
					$scope.$on('$ionicView.enter', init);
				})

		.controller(
				'EditCategoryCtrl',
				function($scope, $ionicPopup, $ionicHistory, $translate,
						$stateParams, Outcomes, Categories, $state) {
					function init() {
						$scope.create = false;
						$scope.title = 'VIEWS.EDIT_CATEGORY.TITLE';
						$scope.newCategory = Categories
								.get($stateParams.categoryId);
					}
					function showConfirm(title, body, buttonOk, buttonCancel) {
						var confirmPopup = $ionicPopup.confirm({
							title : title,
							template : body,
							cancelText : buttonCancel,
							cancelType : 'button-outline button-stable',
							okText : buttonOk,
							okType : 'button-assertive'
						});
						confirmPopup
								.then(function(res) {
									if (res) {
										Outcomes
												.eraseByCategory(
														$stateParams.categoryId,
														Categories
																.get($stateParams.categoryId).name);
										Categories
												.erase($stateParams.categoryId);
										//$ionicHistory.goBack();
										$state.go('app.categories');
										console.log('You are sure');
									} else {
										console.log('You are not sure');
									}
								});
					}
					function showAlert(button) {
						var alertPopup = $ionicPopup.alert({
							templateUrl : "donePopupEdit.html",
							okText : button,
							scope : $scope
						});
						alertPopup.then(function(res) {
							//$ionicHistory.goBack();
							$state.go('app.categories');
						});
					}
					$scope.deleteCategory = function() {
						$translate(
								[
										'VIEWS.EDIT_CATEGORY.POPUP_DELETE_TITLE',
										'VIEWS.EDIT_CATEGORY.POPUP_DELETE_BODY',
										'VIEWS.EDIT_CATEGORY.POPUP_DELETE_ACCEPT',
										'VIEWS.EDIT_CATEGORY.POPUP_DELETE_CANCEL' ])
								.then(
										function(trans) {
											showConfirm(
													trans['VIEWS.EDIT_CATEGORY.POPUP_DELETE_TITLE'],
													trans['VIEWS.EDIT_CATEGORY.POPUP_DELETE_BODY'],
													trans['VIEWS.EDIT_CATEGORY.POPUP_DELETE_ACCEPT'],
													trans['VIEWS.EDIT_CATEGORY.POPUP_DELETE_CANCEL']);
										});
					}
					$scope.editCategory = function() {
						Categories.edit($stateParams.categoryId,
								$scope.newCategory.name);
						$translate('VIEWS.NEW_CATEGORY.BUTTON').then(
								function(trans) {
									showAlert(trans);
								});
					}
					init();
					$scope.$on('$ionicView.enter', init);
				})

		.controller(
				'ConfigurationCtrl',
				function($scope, $ionicPlatform, $translate, $languages,
						$currencies, Config) {
					$scope.languages = $languages;
					$scope.step = 5;
					$scope.alarmId = 1;
					$scope.timePickerCallback = function(val) {
						if (typeof (val) === 'undefined') {
							console.log('Time not selected');
						} else {
							$scope.config.alarm.time = val;
							Config.save();
							$translate('VIEWS.CONFIGURATION.NOTIFICATION')
									.then(function(trans) {
										schedule(trans);
									});
						}
					}
					$scope.changeLanguage = function(newValue) {
						$translate.use($scope.config.language);
						$scope.config.language = $scope.config.language;
						Config.save();
						location.reload();
					}
					$scope.currencies = $currencies;
					$scope.changeCurrency = function(newValue) {
						for (var i = 0; i < $scope.currencies.length; i++)
							if ($scope.currencies[i].val == $scope.config.currency)
								$scope.config.currencyValue = $scope.currencies[i].currency;
						Config.save();
					}
					$scope.toggleAlarm = function() {
						if ($scope.config.alarm.isOn)
							$translate('VIEWS.CONFIGURATION.NOTIFICATION')
									.then(function(trans) {
										schedule(trans);
									});
						else
							cancel();
						Config.save();
					}
					$scope.changeInitial = function(){
						Config.save();
					}
					function cancel() {
						$ionicPlatform
								.ready(function() {
									cordova.plugins.notification.local
											.getScheduledIds(function(
													scheduledIds) {
												for (var i = 0; scheduledIds.length > i; i++) {
													cordova.plugins.notification.local
															.cancel(scheduledIds[i]);
												}
											});
									// cordova.plugins.notification.local
									// .clearAll(function() {
									// console.log("done");
									// }, this);
								});
					}
					function schedule(trans) {
						var hours = parseInt($scope.config.alarm.time / 3600);
						var minutes = ($scope.config.alarm.time / 60) % 60;
						var date = new Date();
						date.setHours(hours, minutes, 0, 0);
						var compare = new Date();
						if (date < compare) {
							date.setDate(compare.getDate() + 1)
						}
						$ionicPlatform.ready(function() {
							cordova.plugins.notification.local.isPresent(1,
									function(present) {
										var data = {
											id : $scope.alarmId,
											text : trans,
											at : date,
											every : "day",
											led : "FF0000"
										};
										if (present)
											cordova.plugins.notification.local
													.update(data);
										else
											cordova.plugins.notification.local
													.schedule(data);
									});
						});
					}
				})

		.controller(
				'CalendarCtrl',
				function($scope, $translate, $languages, Outcomes, Incomes) {
					var incomes, outcomes;
					function loadEvents() {
						for (var i = 0; i < incomes.length; i++) {
							for (var j = 0; j < incomes[i].dailyIncomes.length; j++) {
								var temp = {
									date : incomes[i].dailyIncomes[j].date,
									amount : incomes[i].dailyIncomes[j].amount,
									type : incomes[i].dailyIncomes[j].type
								}
								temp.date = new Date(temp.date);
								temp.isIncome = true;
								temp.parent = {
									name : incomes[i].name,
									category : incomes[i].type
								}
								$scope.events.push(temp);
							}
						}
						for (var i = 0; i < outcomes.length; i++) {
							for (var j = 0; j < outcomes[i].dailyOutcomes.length; j++) {
								var temp = {
									date : outcomes[i].dailyOutcomes[j].date,
									amount : outcomes[i].dailyOutcomes[j].amount,
								}
								temp.date = new Date(temp.date);
								temp.isIncome = false;
								temp.parent = {
									name : outcomes[i].name,
									category : outcomes[i].category
								}
								$scope.events.push(temp);
							}
						}
					}
					function initByDate(date) {
						$scope.actualEvents = [];
						for (var i = 0; i < $scope.events.length; i++) {
							if ($scope.events[i].date.toJSON().slice(0, 10) == date
									.toJSON().slice(0, 10)) {
								$scope.actualEvents.push($scope.events[i])
							}
						}
						console.log($scope.actualEvents);
					}
					function setActual(date) {
						$scope.actualEvents = date.event;
						$scope.actualDate = date.date;
						console.log(date);
					}
					function init() {
						incomes = Incomes.all();
						outcomes = Outcomes.all();
						$scope.events = [];
						loadEvents();
						initByDate($scope.actualDate);
					}
					$scope.actualDate = new Date();
					$scope.options = {
						defaultDate : new Date(),
						dayNamesLength : 1,
						mondayIsFirstDay : false,
						eventClick : setActual,
						dateClick : setActual,
						changeMonth : function(month, year) {
							console.log(month, year);
						},
					};
					$scope.actualEvents = [];
					init();
					$scope.$on('$ionicView.enter', init);
				})

		.controller(
				'HistoryCtrl',
				function($scope, $ionicScrollDelegate, $years, $months,
						Incomes, Outcomes) {
					$scope.graph = {
						options : {
							axes : {
								x : {
									key : 'x',
									type : 'date',
									ticksRotate : -45,
									ticksFormat : '%m/%Y'
								},
								y : {
									type : 'linear'
								},
							},
							margin : {
								bottom : 100,
								left : 90
							},
							drawLegend : true,
							drawDots : true,
							hideOverflow : false,
						// columnsHGap : 5
						},
						data : [],
						radioOption : "compare",
						hidden : true
					};
					var incomes, outcomes, globalNow = new Date();
					$scope.years = $years;
					$scope.months = $months;
					$scope.dates = {
						compareMonthOne : $scope.months[(globalNow.getMonth() == 0 ? 11
								: globalNow.getMonth() - 1)],
						compareMonthTwo : $scope.months[globalNow.getMonth()],
						compareYearOne : $scope.years[(globalNow.getMonth() == 0 ? $scope.years.length - 2
								: $scope.years.length - 1)],
						compareYearTwo : $scope.years[$scope.years.length - 1]
					}
					function init() {
						incomes = Incomes.allActive();
						outcomes = Outcomes.allActive();
						$scope.updateChart();
					}
					function updateRange() {
						$scope.graph.data = [];
						$scope.graph.hidden = false;
						$scope.graph.options.axes.x.type = "date";
						$scope.graph.options.axes.x.ticks = [];
						$scope.graph.options.series = [
								{
									y : "income",
									visible : true,
									type : 'area',
									label : ($scope.config.language == 'es' ? "Entrada"
											: "Income")
								},
								{
									y : "outcome",
									visible : true,
									type : 'area',
									label : ($scope.config.language == 'es' ? "Salida"
											: "Outcome")
								}, {
									y : "total",
									visible : true,
									striped : true,
									type : 'area',
									label : 'Total'
								} ];
						var startDate = new Date(
								$scope.dates.compareYearOne.name + '/'
										+ $scope.dates.compareMonthOne.val);
						var endDate = new Date($scope.dates.compareYearTwo.name
								+ '/' + $scope.dates.compareMonthTwo.val);
						var now = new Date(endDate);
						for (var d = new Date(startDate); d <= now; d
								.setMonth(d.getMonth() + 1)) {
							var date = new Date(d);
							console.log(date.toJSON().slice(0, 7));
							var income = Incomes.totalsPreviousMonth(date
									.toJSON().slice(0, 7)).amount;
							var outcome = Outcomes.totalsPreviousMonth(date
									.toJSON().slice(0, 7)).amount;
							var temp = {
								x : date,
								"income" : income,
								"outcome" : outcome,
								"total" : income - outcome
							}
							$scope.graph.options.axes.x.ticks.push(date);
							$scope.graph.data.push(temp);
						}
					}
					function updateCompare() {
						$scope.graph.options.axes.x.type = "date";
						$scope.graph.options.series = [
								{
									y : "income",
									visible : true,
									type : 'column',
									label : ($scope.config.language == 'es' ? "Entradas"
											: "Income")
								},
								{
									y : "outcome",
									visible : true,
									type : 'column',
									label : ($scope.config.language == 'es' ? "Salidas"
											: "Outcome")
								}, {
									y : "total",
									visible : true,
									striped : true,
									type : 'column',
									label : 'Total'
								} ];
						$scope.graph.hidden = false;
						var dateOne = $scope.dates.compareYearOne.name + '/'
								+ $scope.dates.compareMonthOne.val;
						var dateTwo = $scope.dates.compareYearTwo.name + '/'
								+ $scope.dates.compareMonthTwo.val;
						var realDateOne = new Date(dateOne);
						var realDateTwo = new Date(dateTwo);
						$scope.graph.options.axes.x.ticks = [ realDateOne,
								realDateTwo ];
						$scope.graph.options.axes.x.ticksFormat = '%m/%Y';
						$scope.graph.data = [];
						var incomeOne = Incomes.totalsPreviousMonth(realDateOne
								.toJSON().slice(0, 7)).amount;
						var outcomeOne = Outcomes
								.totalsPreviousMonth(realDateOne.toJSON()
										.slice(0, 7)).amount;
						var incomeTwo = Incomes.totalsPreviousMonth(realDateTwo
								.toJSON().slice(0, 7)).amount;
						var outcomeTwo = Outcomes
								.totalsPreviousMonth(realDateTwo.toJSON()
										.slice(0, 7)).amount;
						$scope.graph.data = [ {
							x : realDateOne,
							"income" : incomeOne,
							"outcome" : outcomeOne,
							"total" : incomeOne - outcomeOne
						}, {
							x : realDateTwo,
							"income" : incomeTwo,
							"outcome" : outcomeTwo,
							"total" : incomeTwo - outcomeTwo
						} ];
					}
					$scope.updateChart = function() {
						if ($scope.graph.radioOption == 'compare')
							updateCompare();
						else
							updateRange();
						$ionicScrollDelegate.resize();
					}
					$scope.resetGraph = function() {
						Chart.reset();
					}
					$scope.showHideGraph = function(show) {
						Chart.showOrHide(show);
					}
					$scope.switchArea = function(type) {
						Chart.switchArea(type);
					}
					$scope.rangeStartDateCallback = function(val) {
						if (typeof (val) === 'undefined') {
							console.log('Date not selected');
						} else {
							console.log('Selected date is : ', val);
							$scope.rangeStartDate = val;
						}
					}
					$scope.rangeEndDateCallback = function(val) {
						if (typeof (val) === 'undefined') {
							console.log('Date not selected');
						} else {
							console.log('Selected date is : ', val);
							$scope.rangeEndDate = val;
						}
					}
					$scope.$on('$ionicView.enter', init);
				})

		.controller(
				'ResetCtrl',
				function($rootScope, $scope, $translate, $ionicPopup, Config,
						Categories, Outcomes, Incomes) {
					function init() {
						$scope.checks = {
							configuration : false,
							categories : false,
							allOutcomes : false,
							allIncomes : false,
							dailyOutcomes : false,
							dailyIncomes : false,
							dailyOutcomesActual : false,
							dailyIncomesActual : false
						}
					}
					function showAlert(title, body, button) {
						var alertPopup = $ionicPopup.alert({
							title : title,
							template : body,
							okText : button,
							scope : $scope
						});
					}
					function reset() {
						if ($scope.checks.configuration) {
							Config.reset();
							$rootScope.config = Config.all();
						}
						if ($scope.checks.categories) {
							Outcomes.reset();
							Categories.reset();
						} else {
							if ($scope.checks.dailyOutcomes
									&& !$scope.checks.allOutcomes)
								Outcomes.resetDaily();
							else if ($scope.checks.dailyOutcomesActual
									&& !$scope.checks.allOutcomes)
								Outcomes.resetDailyActual();
							if ($scope.checks.allOutcomes)
								Outcomes.reset();
						}
						if ($scope.checks.dailyIncomes
								&& !$scope.checks.allIncomes)
							Incomes.resetDaily();
						else if ($scope.checks.dailyIncomesActual
								&& !$scope.checks.allIncomes)
							Incomes.resetDailyActual();
						if ($scope.checks.allIncomes)
							Incomes.reset();
						$translate(
								[ 'VIEWS.RESET.ALERT_TITLE',
										'VIEWS.RESET.ALERT_BODY',
										'VIEWS.RESET.ALERT_BUTTON' ]).then(
								function(trans) {
									showAlert(trans['VIEWS.RESET.ALERT_TITLE'],
											trans['VIEWS.RESET.ALERT_BODY'],
											trans['VIEWS.RESET.ALERT_BUTTON']);
								});
					}
					function showConfirm(title, body, buttonOk, buttonCancel) {
						var confirmPopup = $ionicPopup.confirm({
							title : title,
							template : body,
							cancelText : buttonCancel,
							cancelType : 'button-outline button-stable',
							okText : buttonOk,
							okType : 'button-assertive'
						});
						confirmPopup.then(function(res) {
							if (res) {
								reset();
								console.log('You are sure');
							} else {
								console.log('You are not sure');
							}
						});
					}
					$scope.noChecks = function() {
						for ( var key in $scope.checks) {
							if ($scope.checks.hasOwnProperty(key)
									&& $scope.checks[key]) {
								return false;
							}
						}
						return true;
					}
					$scope.askReset = function() {
						$translate(
								[ 'VIEWS.RESET.POPUP_TITLE',
										'VIEWS.RESET.POPUP_BODY',
										'VIEWS.RESET.POPUP_ACCEPT',
										'VIEWS.RESET.POPUP_CANCEL' ]).then(
								function(trans) {
									showConfirm(
											trans['VIEWS.RESET.POPUP_TITLE'],
											trans['VIEWS.RESET.POPUP_BODY'],
											trans['VIEWS.RESET.POPUP_ACCEPT'],
											trans['VIEWS.RESET.POPUP_CANCEL']);
								});
					}
					init();
					$scope.$on('$ionicView.enter', init);
				})

		.controller('HelpCtrl', function($scope, $faqs, $help) {
			function init() {
				$scope.faqs = $faqs;
				$scope.helps = $help;
			}
			init();
			$scope.$on('$ionicView.enter', init);
		})

		.controller(
				'HelpDetailCtrl',
				function($scope, $stateParams, $faqs, $help) {
					function init() {
						$scope.help = {};
						if ($stateParams.name != undefined) {
							if ($stateParams.name == "faq") {
								$scope.help.title = $faqs[$stateParams.index].question;
								$scope.help.detail = $faqs[$stateParams.index].answer;
							} else if ($stateParams.name == "screen") {
								$scope.help = $help[$stateParams.index];
								$scope.help = $help[$stateParams.index];
							}
						}
					}
					init();
					$scope.$on('$ionicView.enter', init);
				});
