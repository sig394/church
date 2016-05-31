angular
		.module('Contabilidad.services', [])
		.factory(
				'Sessions',
				function() {
					return{
						setSession: function(){
							
						}
					}
				})
		.factory(
				'Config',
				function($ionicPlatform) {
					var config = {};
					if (localStorage.getItem("config") != null) {
						config = JSON.parse(localStorage.getItem("config"));
					} else {
						config = {
							'language' : navigator.language.substring(0, 2),
							'currency' : 'peso',
							'currencyValue' : '$',
							'initial': 0,
							'alarm' : {
								'isOn' : false,
								'time' : 36000,
								'format' : 12,
							}
						};
						localStorage.setItem("config", JSON.stringify(config));
					}
					return {
						reset : function() {
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
									});
							config = {
								'language' : navigator.language.substring(0, 2),
								'currency' : 'peso',
								'currencyValue' : '$',
								'initial': 0,
								'alarm' : {
									'isOn' : false,
									'time' : 36000,
									'format' : 12,
								}
							};
							return this.save();
						},
						all : function() {
							return config;
						},
						set : function(configId, val) {
							config[configId] = val;
							return this.save();
						},
						save : function() {
							localStorage.setItem("config", JSON
									.stringify(config));
							return true;
						},
						get : function(configId) {
							return config[configId];
						}
					}
				})

		.factory(
				'Categories',
				function(Outcomes,$http) {
					var categories = JSON.parse(localStorage.getItem("category"));
					return {
						initialize: function(){
							var promise = $http.get('http://www.iblhos.com.ar/back/finanzas/api/public/categories').
							    success(function(data) {
							    	localStorage.setItem("category", JSON.stringify(data.data));	
							    	categories = data.data;
							});
							return promise;
						},
						totals : function() {
							var now = new Date();
							var stringNow = new Date(now.setMonth(now
									.getMonth()));
							stringNow = stringNow.toJSON().slice(0, 7);
							var outcomes = Outcomes.all();
							var totals = {};
							for (var h = 0; h < categories.length; h++) {
								totals[categories[h].id] = {
									amount : 0,
									budget : 0
								};
								for (var i = 0; i < outcomes.length; i++) {
									if (outcomes[i].active
											&& outcomes[i].category_id == categories[h].id) {
										var outcomeAmount = Outcomes
												.totalAmount(outcomes[i].id,
														null);
//										if (outcomeAmount != 0) {
											totals[categories[h].id].budget += outcomes[i].budget;
//											addedBudget = true;
											totals[categories[h].id].amount += outcomeAmount;
//										}
									}
								}
							}
							return totals;
						},
						exists : function(name) {
							for (var i = 0; i < categories.length; i++)
								if (categories[i].name == name)
									return true;
							return false;
						},
						reset : function() {
							categories = [];
							//this.save();
							return categories;
						},
						save : function() {
							localStorage.setItem("categories", JSON
									.stringify(categories));
							return true;
						},
						all : function() {
					        return categories;
						},
						add : function(newName) {
							var data = {name: newName};
							var promise = $http.post('http://www.iblhos.com.ar/back/finanzas/api/public/categories', data)
					            .success(function (data, status, headers, config) {
					                
					            })
					            .error(function (data, status, header, config) {
					        });
					        return promise;
						},
						edit : function(id, newCategory) {
							var data = {name: newCategory};
							$http.put('http://www.iblhos.com.ar/back/finanzas/api/public/categories/' + id, data)
					            .success(function (data, status, headers, config) {
					                console.log(data);
					            })
					            .error(function (data, status, header, config) {
					                console.log(data);
					        });
					        for (var i = 0; i < categories.length; i++)
								if (categories[i].id == id) {
									categories[i].name = newCategory;
									this.save();
									return true;
								}
						},
						erase : function(id) {
							$http.delete('http://www.iblhos.com.ar/back/finanzas/api/public/categories/' + id)
					            .success(function (data, status, headers, config) {
					                console.log(data);
					            })
					            .error(function (data, status, header, config) {
					                console.log(data);
					        });
					        for (var i = 0; i < categories.length; i++)
								if (categories[i].id == id) {
									categories.splice(i, 1);
									this.save();
									return true;
								}    
						},
						getByIndex : function(index) {
							return categories[index];
						},
						get : function(id) {
							for (var i = 0; i < categories.length; i++)
								if (categories[i].id == id)
									return categories[i];
							return null;
						}
					}
				})

		.factory(
				'Outcomes',
				function($http) {
					var outcomes = JSON.parse(localStorage.getItem("outcomes"));		
					return {
						initialize: function(){
							var promise = $http.get('http://www.iblhos.com.ar/back/finanzas/api/public/outcomes').
							    success(function(data) {
							       	localStorage.setItem("outcomes", JSON.stringify(data.data));
							        outcomes = data.data;
							});
							return promise;
						},
						exists : function(name) {
							for (var i = 0; i < outcomes.length; i++)
								if (outcomes[i].active > 0 
										&& outcomes[i].name == name)
									return true;
							return false;
						},
						totalsPreviousMonth : function(month) {
							if (month == null) {
								var now = new Date();
								var stringNow = new Date(now.setMonth(now
										.getMonth() - 1));
								stringNow = stringNow.toJSON().slice(0, 7);
							} else {
								stringNow = month;
							}
							var total = {
								amount : 0,
								budget : 0
							}
							for (var i = 0; i < outcomes.length; i++) {
								if (outcomes[i].active > 0) {
									var addedBudget = false;
									for (var j = 0; j < outcomes[i].daily_outcomes.length; j++) {
										if (stringNow == outcomes[i].daily_outcomes[j].date
												.slice(0, 7)) {
											total.amount += parseInt(outcomes[i].daily_outcomes[j].amount);
											if (!addedBudget) {
												total.budget += parseInt(outcomes[i].budget);
												addedBudget = true;
											}
										}
									}
								}
							}
							return total;
						},
						totalsActualMonth : function() {
							var now = new Date();
							var stringNow = new Date(now.setMonth(now
									.getMonth()));
							stringNow = stringNow.toJSON().slice(0, 7);
							var total = {
								amount : 0,
								budget : 0
							}
							for (var i = 0; i < outcomes.length; i++) {
								if (outcomes[i].active > 0) {
									total.budget += parseInt(outcomes[i].budget);
									for (var j = 0; j < outcomes[i].daily_outcomes.length; j++) {
										if (stringNow == outcomes[i].daily_outcomes[j].date
												.slice(0, 7)) {
											total.amount += parseInt(outcomes[i].daily_outcomes[j].amount);
										}
									}
								}
							}
							return total;
						},
						totalsAllButActualMonth : function() {
							var now = new Date();
							var stringNow = new Date(now.setMonth(now
									.getMonth()));
							stringNow = stringNow.toJSON().slice(0, 7);
							var total = {
								amount : 0,
								budget : 0
							}
							for (var i = 0; i < outcomes.length; i++) {
								if (outcomes[i].active > 0) {
									var addedBudget = false;
									for (var j = 0; j < outcomes[i].daily_outcomes.length; j++) {
										if (stringNow != outcomes[i].daily_outcomes[j].date
												.slice(0, 7)) {
											total.amount += parseInt(outcomes[i].daily_outcomes[j].amount);
											if (!addedBudget) {
												total.budget += parseInt(outcomes[i].budget);
												addedBudget = true;
											}
										}
									}
								}
							}
							return total;
						},
						totals : function() {
							var total = {
								amount : 0,
								budget : 0
							}
							for (var i = 0; i < outcomes.length; i++) {
								if (outcomes[i].active) {
									total.amount += parseInt(outcomes[i].amount);
									total.budget += parseInt(outcomes[i].budget);
								}
							}
							return total;
						},
						totalAmount : function(id, month) {
							if (month == null) {
								var now = new Date();
								var stringNow = new Date(now.setMonth(now
										.getMonth()));
								stringNow = stringNow.toJSON().slice(0, 7);
							} else {
								stringNow = month;
							}
							var total = 0;
							for (var index = 0; index < outcomes.length; index++)
								if (outcomes[index].id == id) {
									for (var i = 0; i < outcomes[index].daily_outcomes.length; i++) {
										if (stringNow == outcomes[index].daily_outcomes[i].date
												.slice(0, 7)) {
											total += parseInt(outcomes[index].daily_outcomes[i].amount);
										}
									}
								}
							return total;
						},
						resetDaily : function() {
							for (var i = 0; i < outcomes.length; i++) {
								outcomes[i].daily_outcomes = [];
								outcomes[i].amount = 0;
							}
							//this.save();
							return outcomes;
						},
						resetDailyActual : function() {
							var now = new Date();
							var stringNow = new Date(now.setMonth(now
									.getMonth()));
							stringNow = stringNow.toJSON().slice(0, 7);
							for (var i = 0; i < outcomes.length; i++) {
								var j = outcomes[i].daily_outcomes.length;
								while (j--) {
									if (stringNow == outcomes[i].daily_outcomes[j].date
											.slice(0, 7)) {
										outcomes[i].daily_outcomes.splice(j, 1);
									}
								}
							}
							return outcomes;
						},
						reset : function() {
							outcomes = [];
							this.save();
							return outcomes;
						},
						save : function() {
							localStorage.setItem("outcomes", JSON
									.stringify(outcomes));
							return true;
						},
						all : function() {
							return outcomes;
						},
						allActive : function() {
							var temp = [];
							for (var i = 0; i < outcomes.length; i++) {
								if (outcomes[i].active > 0)
									temp.push(outcomes[i]);
							}
							return temp;
						},
						add : function(newOutcome) {
							var data = newOutcome;
							var promise = $http.post('http://www.iblhos.com.ar/back/finanzas/api/public/outcomes', data)
					            .success(function (data, status, headers, config) {
					        		
					            })
					            .error(function (data, status, header, config) {
					                console.log(data);
					        });
					        //outcomes.push(newOutcome);
					        //this.save();
					        return promise;
						},
						edit : function(id, newOutcome) {
							var data = newOutcome;
							$http.put('http://www.iblhos.com.ar/back/finanzas/api/public/outcomes/' + id, data)
					            .success(function (data, status, headers, config) {
					        		
					            })
					            .error(function (data, status, header, config) {
					        });

							for (var i = 0; i < outcomes.length; i++)
								if (outcomes[i].id == id) {
									outcomes[i] = newOutcome;
									//for (var j = 0; j < outcomes[i].dailyOutcomes.length; i++)
									//	outcomes[i].daily_outcomes[j].category = outcomes[i].category;
									this.save();
									return true;
								}
							return false;
						},
						eraseByCategory : function(categoryId, categoryName) {
							for (var i = 0; i < outcomes.length; i++)
								if (outcomes[i].category_id == categoryId) {
									outcomes[i].active = 0;
									outcomes[i].category_id = categoryName;
									this.save();
									return true;
								}
							return false;
						},
						erase : function(id) {
							$http.delete('http://www.iblhos.com.ar/back/finanzas/api/public/outcomes/' + id)
					            .success(function (data, status, headers, config) {
					            })
					            .error(function (data, status, header, config) {
					        });

							for (var i = 0; i < outcomes.length; i++)
								if (outcomes[i].id == id) {
									outcomes[i].active = false;
									this.save();
									return true;
								}
							return false;
						},
						addDaily : function(parentId, newOutcome) {
							data = {outcome_id: newOutcome.outcomeParent.id, date:newOutcome.date,amount:newOutcome.amount}
							var promise = $http.post('http://www.iblhos.com.ar/back/finanzas/api/public/daily_outcomes', data)
					            .success(function (data, status, headers, config) {
					        		
					            })
					            .error(function (data, status, header, config) {
					                console.log(data);
					        });
					        return promise;
							/*for (var i = 0; i < outcomes.length; i++)
								if (outcomes[i].id == parentId) {
									if (outcomes[i].daily_outcomes.length > 0)
										newOutcome.id = outcomes[i].dailyOutcomes[outcomes[i].dailyOutcomes.length - 1].id + 1;
									else
										newOutcome.id = 1;
									delete newOutcome.outcomeParent;
									outcomes[i].dailyOutcomes.push(newOutcome);
									outcomes[i].amount += newOutcome.amount;
									this.save();
									return outcomes[i];
								}
							return null;*/
						},
						getByIndex : function(index) {
							return outcomes[index];
						},
						get : function(id) {
							for (var i = 0; i < outcomes.length; i++)
								if (outcomes[i].id == id)
									return outcomes[i];
							return null;
						}
					}
				})

		.factory(
				'Incomes',
				function($http) {
					var incomes = JSON.parse(localStorage.getItem("incomes"));
					return {
						initialize: function(){
							var promise = $http.get('http://www.iblhos.com.ar/back/finanzas/api/public/incomes').
							    success(function(data) {
							       	localStorage.setItem("incomes", JSON.stringify(data.data));
							        incomes = data.data;
							});
							return promise;
						},
						exists : function(name) {
							for (var i = 0; i < incomes.length; i++)
								if (incomes[i].active > 0 && incomes[i].name == name)
									return true;
							return false;
						},
						totalsAllButActualMonth : function() {
							var now = new Date();
							var stringNow = new Date(now.setMonth(now
									.getMonth()));
							stringNow = stringNow.toJSON().slice(0, 7);
							var total = {
								amount : 0,
								budget : 0
							}
							for (var i = 0; i < incomes.length; i++) {
								if (incomes[i].active > 0) {
									var addedBudget = false;
									for (var j = 0; j < incomes[i].daily_incomes.length; j++) {
										if (stringNow != incomes[i].daily_incomes[j].date
												.slice(0, 7)) {
											total.amount += incomes[i].daily_incomes[j].amount;
											if (!addedBudget) {
												total.budget += incomes[i].budget;
												addedBudget = true;
											}
										}
									}
								}
							}
							return total;
						},
						totalsPreviousMonth : function(month) {
							if (month == null) {
								var now = new Date();
								var stringNow = new Date(now.setMonth(now
										.getMonth() - 1));
								stringNow = stringNow.toJSON().slice(0, 7);
							} else {
								stringNow = month;
							}
							var total = {
								amount : 0,
								budget : 0
							}
							for (var i = 0; i < incomes.length; i++) {
								if (incomes[i].active > 0) {
									var addedBudget = false;
									for (var j = 0; j < incomes[i].daily_incomes.length; j++) {
										if (stringNow == incomes[i].daily_incomes[j].date
												.slice(0, 7)) {
											total.amount += incomes[i].daily_incomes[j].amount;
											if (!addedBudget) {
												total.budget += incomes[i].budget;
												addedBudget = true;
											}
										}
									}
								}
							}
							return total;
						},
						totalsActualMonth : function() {
							var now = new Date();
							var stringNow = new Date(now.setMonth(now
									.getMonth()));
							stringNow = stringNow.toJSON().slice(0, 7);
							var total = {
								amount : 0,
								budget : 0
							}
							for (var i = 0; i < incomes.length; i++) {
								if (incomes[i].active > 0) {
									total.budget += incomes[i].budget;
									for (var j = 0; j < incomes[i].daily_incomes.length; j++) {
										if (stringNow == incomes[i].daily_incomes[j].date
												.slice(0, 7)) {
											total.amount += incomes[i].daily_incomes[j].amount;
										}
									}
								}
							}
							return total;
						},
						totalsActualMonthWithType : function() {
							var total = {
								0 : {
									amount : 0,
									budget : 0
								},
								1 : {
									amount : 0,
									budget : 0
								}
							}
							var now = new Date();
							var stringNow = new Date(now.setMonth(now
									.getMonth()));
							stringNow = stringNow.toJSON().slice(0, 7);
							for (var i = 0; i < incomes.length; i++) {
								if (incomes[i].active > 0) {
									total[incomes[i].type].budget += incomes[i].budget;
									for (var j = 0; j < incomes[i].daily_incomes.length; j++) {
										if (stringNow == incomes[i].daily_incomes[j].date
												.slice(0, 7)) {
											total[incomes[i].type].amount += incomes[i].daily_incomes[j].amount;
										}
									}
								}
							}
							return total;
						},
						totalAmount : function(index, month) {
							if (month == null) {
								var now = new Date();
								var stringNow = new Date(now.setMonth(now
										.getMonth()));
								stringNow = stringNow.toJSON().slice(0, 7);
							} else {
								stringNow = month;
							}
							var total = 0;
							for (var h = 0; h < incomes.length; h++)
								if (incomes[h].id == index) {
									for (var i = 0; i < incomes[h].daily_incomes.length; i++) {
										if (stringNow == incomes[h].daily_incomes[i].date
												.slice(0, 7)) {
											total += incomes[h].daily_incomes[i].amount;
										}
									}
								}
							return total;
						},
						totals : function() {
							var total = {
								0 : {
									amount : 0,
									budget : 0
								},
								1 : {
									amount : 0,
									budget : 0
								}
							}
							for (var i = 0; i < incomes.length; i++) {
								if (incomes[i].active > 0) {
									total[incomes[i].type].amount += incomes[i].amount;
									total[incomes[i].type].budget += incomes[i].budget;
								}
							}
							return total;
						},
						resetDaily : function() {
							for (var i = 0; i < incomes.length; i++) {
								incomes[i].dailyIncomes = [];
								incomes[i].amount = 0;
							}
							this.save();
							return incomes;
						},
						resetDailyActual : function() {
							var now = new Date();
							var stringNow = new Date(now.setMonth(now
									.getMonth()));
							stringNow = stringNow.toJSON().slice(0, 7);
							for (var i = 0; i < incomes.length; i++) {
								var j = incomes[i].daily_incomes.length;
								while (j--) {
									if (stringNow == incomes[i].daily_incomes[j].date
											.slice(0, 7)) {
										incomes[i].daily_incomes.splice(j, 1);
									}
								}
							}
							return incomes;
						},
						reset : function() {
							incomes = [];
							this.save();
							return incomes;
						},
						save : function() {
							localStorage.setItem("incomes", JSON
									.stringify(incomes));
							return true;
						},
						allActive : function() {

							var temp = [];
							for (var i = 0; i < incomes.length; i++) {
								if (incomes[i].active > 0)
									temp.push(incomes[i]);
							}
							return temp;
						},
						all : function() {
							return incomes;
						},
						addDaily : function(parentId, newIncome) {
							data = {income_id: newIncome.incomeParent.id, date:newIncome.date,amount:newIncome.amount, type:newIncome.type}
							var promise = $http.post('http://www.iblhos.com.ar/back/finanzas/api/public/daily_incomes', data)
					            .success(function (data, status, headers, config) {
					        		
					            })
					            .error(function (data, status, header, config) {
					        });
					        return promise;
					        /*
							for (var i = 0; i < incomes.length; i++)
								if (incomes[i].id == parentId) {
									if (incomes[i].dailyIncomes.length > 0)
										newIncome.id = incomes[i].dailyIncomes[incomes[i].dailyIncomes.length - 1].id + 1;
									else
										newIncome.id = 1;
									delete newIncome.incomeParent;
									incomes[i].dailyIncomes.push(newIncome);
									incomes[i].amount += newIncome.amount;
									this.save();
									return incomes[i];
								}
							return null;*/
						},
						add : function(newIncome) {
							var data = newIncome;
							console.log(newIncome);
							var promise = $http.post('http://www.iblhos.com.ar/back/finanzas/api/public/incomes', data)
					            .success(function (data, status, headers, config) {
					            })
					            .error(function (data, status, header, config) {
					        });
					        return promise;
					        /*
							if (incomes.length > 0)
								newIncome.id = incomes[incomes.length - 1].id + 1;
							else
								newIncome.id = 1;
							newIncome.active = true;
							incomes.push(newIncome);
							this.save();
							return incomes;*/
						},
						edit : function(id, newIncome) {
							var data = newIncome;
							$http.put('http://www.iblhos.com.ar/back/finanzas/api/public/incomes/' + id, data)
					            .success(function (data, status, headers, config) {
					            })
					            .error(function (data, status, header, config) {
					        });

							for (var i = 0; i < incomes.length; i++)
								if (incomes[i].id == id) {
									incomes[i] = newIncome;
									//for (var j = 0; j < incomes[i].daily_incomes.length; i++)
									//	incomes[i].daily_incomes[j].type = incomes[i].type;
									this.save();
									return true;
								}
							return false;
						},
						erase : function(id) {
							$http.delete('http://www.iblhos.com.ar/back/finanzas/api/public/incomes/' + id)
					            .success(function (data, status, headers, config) {
					            })
					            .error(function (data, status, header, config) {
					        });

							for (var i = 0; i < incomes.length; i++)
								if (incomes[i].id == id) {
									incomes[i].active = 0;
									this.save();
									return true;
								}
							return false;
						},
						getByIndex : function(index) {
							return incomes[index];
						},
						get : function(id) {
							for (var i = 0; i < incomes.length; i++)
								if (incomes[i].id == id)
									return incomes[i];
							return null;
						}
					}
				})

		.factory('ViewsButton', function($ionicHistory, $ionicPlatform) {
			var views = {
				"app.categories" : {
					hasRightButton : true,
					href : "#/app/categories/newCategory",
					goTo : "app.newCategory"
				},
				"app.outcome" : {
					hasRightButton : true,
					href : "#/app/outcome/newOutcome",
					goTo : "app.newOutcome"
				},
				"app.income" : {
					hasRightButton : true,
					href : "#/app/income/newIncome",
					goTo : "app.newIncome"
				}
			};
			return {
				get : function() {
					var temp = null;
					$ionicPlatform.ready(function() {
						temp = views[$ionicHistory.currentStateName()];
					});
					return temp;
				}
			}
		})

		.factory('$incomeTypes', function() {
			var incomeTypes = {};
			incomeTypes = [ {
				val : 0,
				name : 'VIEWS.NEW_INCOME.TYPE_LINEAL'
			}, {
				val : 1,
				name : 'VIEWS.NEW_INCOME.TYPE_PASSIVE'
			} ];
			return incomeTypes;
		})

		.factory('$languages', function() {
			var languages = {};
			languages = [ {
				val : 'es',
				name : 'LANGUAGES.ES.NAME'
			}, {
				val : 'en',
				name : 'LANGUAGES.EN.NAME'
			} ];
			return languages;
		})

		.factory('$currencies', function() {
			var currencies = {};
			currencies = [ {
				val : 'peso',
				name : 'CURRENCY.PESO.NAME',
				currency : '$'
			}, {
				val : 'dollar',
				name : 'CURRENCY.DOLLAR.NAME',
				currency : 'U$D '
			}, {
				val : 'euro',
				name : 'CURRENCY.EURO.NAME',
				currency : '€'
			} ];
			return currencies;
		})

		.factory('$faqs', function() {
			var faqs = {};
			faqs = [ {
				id : 1,
				question : 'FAQS.FAQ_1.QUESTION',
				answer : 'FAQS.FAQ_1.ANSWER'
			}, {
				id : 2,
				question : 'FAQS.FAQ_2.QUESTION',
				answer : 'FAQS.FAQ_2.ANSWER'
			}, {
				id : 3,
				question : 'FAQS.FAQ_3.QUESTION',
				answer : 'FAQS.FAQ_3.ANSWER'
			}, {
				id : 4,
				question : 'FAQS.FAQ_4.QUESTION',
				answer : 'FAQS.FAQ_4.ANSWER'
			}, {
				id : 5,
				question : 'FAQS.FAQ_5.QUESTION',
				answer : 'FAQS.FAQ_5.ANSWER'
			}, {
				id : 6,
				question : 'FAQS.FAQ_6.QUESTION',
				answer : 'FAQS.FAQ_6.ANSWER'
			}, {
				id : 7,
				question : 'FAQS.FAQ_7.QUESTION',
				answer : 'FAQS.FAQ_7.ANSWER'
			}, {
				id : 8,
				question : 'FAQS.FAQ_8.QUESTION',
				answer : 'FAQS.FAQ_8.ANSWER'
			}, {
				id : 9,
				question : 'FAQS.FAQ_9.QUESTION',
				answer : 'FAQS.FAQ_9.ANSWER'
			}, {
				id : 10,
				question : 'FAQS.FAQ_10.QUESTION',
				answer : 'FAQS.FAQ_10.ANSWER'
			} ];
			return faqs;
		})

		.factory('$help', function() {
			var help = {};
			help = [ {
				id : 1,
				title : 'HELP.HOME.TITLE',
				detail : 'HELP.HOME.DETAIL',
				icon : 'ion-arrow-graph-up-right'
			}, {
				id : 2,
				title : 'HELP.INCOME.TITLE',
				detail : 'HELP.INCOME.DETAIL',
				icon : 'ion-ios-download-outline'
			}, {
				id : 3,
				title : 'HELP.OUTCOME.TITLE',
				detail : 'HELP.OUTCOME.DETAIL',
				icon : 'ion-ios-upload-outline'
			}, {
				id : 4,
				title : 'HELP.CATEGORIES.TITLE',
				detail : 'HELP.CATEGORIES.DETAIL',
				icon : 'ion-ios-pricetags'
			}, {
				id : 5,
				title : 'HELP.HISTORY.TITLE',
				detail : 'HELP.HISTORY.DETAIL',
				icon : 'ion-ios-list-outline'
			}, {
				id : 6,
				title : 'HELP.CONFIGURATION.TITLE',
				detail : 'HELP.CONFIGURATION.DETAIL',
				icon : 'ion-gear-b'
			}, {
				id : 7,
				title : 'HELP.CALENDAR.TITLE',
				detail : 'HELP.CALENDAR.DETAIL',
				icon : 'ion-ios-calendar-outline'
			}, {
				id : 8,
				title : 'HELP.RESET.TITLE',
				detail : 'HELP.RESET.DETAIL',
				icon : 'ion-ios-refresh-outline'
			} ];
			return help;
		})

		.factory('$years', function() {
			var date = new Date, years = [], year = date.getFullYear();
			var id = 0;
			for (var i = 2010; i <= year; i++) {
				var temp = {
					id : id,
					name : i
				}
				years.push(temp);
				id++;
			}
			return years;
		})

		.factory('$months', function() {
			var months = {};
			months = [ {
				id : 0,
				val : "01",
				name : 'JANUARY',
			}, {
				id : 1,
				val : "02",
				name : 'FEBRUARY',
			}, {
				id : 2,
				val : "03",
				name : 'MARCH',
			}, {
				id : 3,
				val : "04",
				name : 'APRIL',
			}, {
				id : 4,
				val : "05",
				name : 'MAI',
			}, {
				id : 5,
				val : "06",
				name : 'JUNE',
			}, {
				id : 6,
				val : "07",
				name : 'JULY',
			}, {
				id : 7,
				val : "08",
				name : 'AUGUST',
			}, {
				id : 8,
				val : "09",
				name : 'SEPTEMBER',
			}, {
				id : 9,
				val : "10",
				name : 'OCTOBER',
			}, {
				id : 10,
				val : "11",
				name : 'NOVEMBER',
			}, {
				id : 11,
				val : "12",
				name : 'DECEMBER',
			} ];
			return months;
		});
