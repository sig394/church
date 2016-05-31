angular
		.module('Contabilidad.filters', [])

		.filter(
				"percentage",
				function() {
					return function(input, total) {
						return (total == 0 ? 0 : Math
								.round(((input / total) * 100) * 100) / 100);
					};
				})

		.directive(
				'capitalizeFirst',
				function($parse) {
					return {
						require : 'ngModel',
						link : function(scope, element, attrs, modelCtrl) {
							var capitalize = function(inputValue) {
								if (inputValue === undefined) {
									inputValue = '';
								}
								var capitalized = inputValue.charAt(0)
										.toUpperCase()
										+ inputValue.substring(1);
								if (capitalized !== inputValue) {
									modelCtrl.$setViewValue(capitalized);
									modelCtrl.$render();
								}
								return capitalized;
							}
							modelCtrl.$parsers.push(capitalize);
							capitalize($parse(attrs.ngModel)(scope)); // capitalize
							// initial value
						}
					};
				})

		.directive(
				'standardTimeMeridian',
				function() {
					return {
						restrict : 'AE',
						replace : true,
						scope : {
							etime : '=etime'
						},
						template : "<strong>{{stime}}</strong>",
						link : function(scope, elem, attrs) {

							scope.stime = epochParser(scope.etime, 'time');

							function prependZero(param) {
								if (String(param).length < 2) {
									return "0" + String(param);
								}
								return param;
							}

							function epochParser(val, opType) {
								if (val === null) {
									return "00:00";
								} else {
									var meridian = [ 'AM', 'PM' ];

									if (opType === 'time') {
										var hours = parseInt(val / 3600);
										var minutes = (val / 60) % 60;
										var hoursRes = hours > 12 ? (hours - 12)
												: hours;

										var currentMeridian = meridian[parseInt(hours / 12)];

										return (prependZero(hoursRes) + ":"
												+ prependZero(minutes) + " " + currentMeridian);
									}
								}
							}

							scope.$watch('etime', function(newValue, oldValue) {
								scope.stime = epochParser(scope.etime, 'time');
							});

						}
					};
				});
