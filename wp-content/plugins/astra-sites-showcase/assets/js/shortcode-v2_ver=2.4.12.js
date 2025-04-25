(function($){

	/** Checking the element is in viewport? */
	$.fn.isInViewport = function() {

		// If not have the element then return false!
		if( ! $( this ).length ) {
			return false;
		}

	    var elementTop = $( this ).offset().top;
	    var elementBottom = elementTop + $( this ).outerHeight();

	    var viewportTop = $( window ).scrollTop();
	    var viewportBottom = viewportTop + $( window ).height();

	    return elementBottom > viewportTop && elementTop < viewportBottom;
	};

	AstraSitesShowcaseV2 = {

		autoComplete: [],
		searchTerms: [],

		has_default_page_builder : $('#astra-sites-showcase-v2-wrap').attr( 'data-default-page-builder' ) || '',
		pattern                  : $('#astra-sites-showcase-v2-wrap').attr( 'data-pattern' ) || '',
		hideQueryString          : $('#astra-sites-showcase-v2-wrap').attr( 'data-hide-query-string' ) || '',

		init: function()
		{
			this._show_sites();
			this._load_large_images();
			this._bind();
			this._setAutoCompleteList();
			this._autocomplete();
			// this._auto_close_notice();
		},

		_setAutoCompleteList: function() {

			var sites = AstraShowcaseVars.sites || [];

			// Add site & pages tags in autocomplete.
			var strings = [];

			// Add site title's in autocomplete.
			for( site_id in sites ) {

				if( ! AstraSitesShowcaseV2.has_default_page_builder ) {
					var title = _.unescape( sites[ site_id ]['title'] );

					// @todo check why below character not escape with function _.unescape();
					title = title.replace('&#8211;', '-' );

					strings.push( title );

					// Site Tags.
					var site_tags = sites[ site_id ]['astra-sites-tag'] || [];
					if( site_tags ) {
						for( tag_index in site_tags ) {
							strings.push( _.unescape( site_tags[ tag_index ]['name'] ));
						}
					}
				} else if( AstraSitesShowcaseV2.has_default_page_builder && AstraSitesShowcaseV2.has_default_page_builder === sites[ site_id ]['astra-site-page-builder'] ) {

					var title = _.unescape( sites[ site_id ]['title'] );

					// @todo check why below character not escape with function _.unescape();
					title = title.replace('&#8211;', '-' );

					strings.push( title );

					// Site Tags.
					var site_tags = sites[ site_id ]['astra-sites-tag'] || [];
					if( site_tags ) {
						for( tag_index in site_tags ) {
							strings.push( _.unescape( site_tags[ tag_index ]['name'] ));
						}
					}
				}
			}

			strings = strings.filter(function(item, pos) {
			    return strings.indexOf(item) == pos;
			})
			strings = _.sortBy( strings );

			AstraSitesShowcaseV2.autoComplete = strings;
		},

		_autocomplete: function() {

		    $( "#astra-sites-showcase-v2-search-input" ).autocomplete({
		    	appendTo: ".astra-sites-showcase-v2-autocomplete-result",
		    	classes: {
				    "ui-autocomplete": "astra-sites-showcase-v2-auto-suggest"
				},
		    	source: function(request, response) {
			        var results = $.ui.autocomplete.filter(AstraSitesShowcaseV2.autoComplete, request.term);

			        // var search_term = $( "#astra-sites-showcase-v2-search-input" ).val();
			        // var new_result = [];
			        // if( results.length ) {
			        // 	for( key in results ) {
			        // 		new_result[ key ] = results[key].replace( search_term, '<span>'+search_term+'</span>' );
			        // 	}
			        // }
			        // console.log( new_result );

			        // Show only 10 results.
			        response(results.slice(0, 15));
			    },
		    	open: function( event, ui ) {
		    		$('.astra-sites-showcase-v2-search-wrap').addClass( 'searching' );
		    	},
		    	close: function( event, ui ) {
		    		$('.astra-sites-showcase-v2-search-wrap').removeClass( 'searching' );
		    	}
		    });
		},

		_bind: function() {
			$( window ).on( 'resize scroll'                    , AstraSitesShowcaseV2._load_large_images);
			$( document ).on( 'click', '.selected-filter'                    , AstraSitesShowcaseV2._toggle_filters);
			$( document ).on( 'click', '.selected-site-type'                    , AstraSitesShowcaseV2._toggle_site_type);
			$( document ).on( 'click', '.filter-type li, .filter-page-builder li, .filter-category li'                    , AstraSitesShowcaseV2._toggle_selected_filters);
			$( document ).on( 'click', '.filter-category li'                    , AstraSitesShowcaseV2._suggest_category);
			$( document ).on('keyup input'                     , '#astra-sites-showcase-v2-search-input', AstraSitesShowcaseV2._search );
			$( document ).on( 'keyup' , '#astra-sites-showcase-v2-search-input', _.debounce( AstraSitesShowcaseV2._searchPost, 1500 ) );

			$( document ).on('click'                     , AstraSitesShowcaseV2._hide_filters );
			$( document ).on('click'                     , '.astra-sites-showcase-v2-autocomplete-result .ui-menu-item', AstraSitesShowcaseV2._show_search_term );
		},

		_searchPost: function( e ) {

			if ( ! AstraShowcaseVars.tracking_enabled ) {
				return;
			}

			var term = $( this ).val().trim().toLowerCase();
			if ( '' === term || term.length < 3 ) {
				return;
			}

			if ( ! AstraSitesShowcaseV2.searchTerms.includes( term ) ) {

				var uuid = AstraShowcaseVars.uuid;
				var current_user = window.localStorage.getItem( 'astra-sites-showcase-uuid' );

				if ( current_user ) {
					uuid = current_user;
				} else {
					window.localStorage.setItem( 'astra-sites-showcase-uuid', AstraShowcaseVars.uuid );
				}

				var searchList = $('.astra-sites-showcase-v2-list');
				var pageBuilder = $( '.selected-page-builder' );
				var searchResultCount = searchList.children().not('.astra-sites-suggestions, .astra-sites-showcase-no-agency-sites').length
				var builder = ( pageBuilder.length > 0 ) ? pageBuilder.attr( 'slug' ) : '';

				window.dataLayer = window.dataLayer || [];
  				function gtag(){ dataLayer.push(arguments); }
				gtag('js', new Date());
				gtag('config', AstraShowcaseVars.measurement_id);

				gtag('event', 'STShowcaseSearch', {
					"appId": term,
					"hostName": AstraShowcaseVars.site_url,
					"unifiedScreenName": "astra-sites-showcase",
					"pageBuilder": ( '' !== builder ) ? builder : 'elementor',
					"appVersion": AstraShowcaseVars.ver,
					"searchCount": searchResultCount,
				});

				AstraSitesShowcaseV2.searchTerms.push( term );
			}
		},

		_show_search_term: function() {
			var search_term = $(this).text() || '';
			$('#astra-sites-showcase-v2-search-input').val( search_term );
			$('#astra-sites-showcase-v2-search-input').trigger( 'keyup' );
			$('.filter-category li').removeClass('active');
		},

		_hide_filters: function( event ) {
			var container = $(".selected-filter");
			var site_type = $(".astra-sites-showcase-v2-site-type .selected-site-type");

		    if (
		    	( ! container.is( event.target ) && container.has( event.target ).length === 0 ) &&
		    	( ! site_type.is( event.target ) && site_type.has( event.target ).length === 0 )
	    	) {
	    		$('.astra-sites-showcase-v2-site-type').removeClass( 'open' );
	    		$('.astra-sites-showcase-v2-site-type').removeClass( 'open' );
	    		$('.astra-sites-showcase-v2-site-type .filter-type').hide();
		    	$('.filters-list').hide();
		    }
		},

		_search: function( event ) {

			$('.filters-list').hide();
			$('.filters-wrap').removeClass('open');
			$('.filter-category li').removeClass('active');

			if( 13 === event.keyCode ) {
				$('.astra-sites-showcase-v2-search-wrap').removeClass( 'searching' );
				$('.astra-sites-showcase-v2-autocomplete-result .ui-autocomplete').hide();
			}

			// $('body').removeClass('astra-sites-no-search-result');

			var search_input  = $( '#astra-sites-showcase-v2-search-input' ),
				search_term   = search_input.val() || '';
				// sites         = $('#astra-sites > .astra-theme'),
				// titles = $('#astra-sites > .astra-theme .theme-name');

			// AstraSitesShowcaseV2.close_pages_popup();

			if( search_term.length ) {

				search_input.addClass('has-input');

				// $('#astra-sites-admin').addClass('searching');

				var items = AstraSitesShowcaseV2._get_sites_by_search_term( search_term );

				if( ! AstraSitesShowcaseV2.isEmpty( items ) ) {
					AstraSitesShowcaseV2.add_sites( items );
				} else {
					$('#astra-sites-showcase-v2-list').html( wp.template('astra-sites-showcase-no-sites') );
				}
			} else {
				$('.filter-category li').removeClass('active');
				search_input.removeClass('has-input');
				var items = AstraSitesShowcaseV2._get_sites_by_search_term( '' );

				if( ! AstraSitesShowcaseV2.isEmpty( items ) ) {
					AstraSitesShowcaseV2.add_sites( items );
				} else {
					$('#astra-sites-showcase-v2-list').html( wp.template('astra-sites-showcase-no-sites') );
				}
			}

			AstraSitesShowcaseV2._change_urls();
		},

		_toggle_site_type: function() {
			$('.astra-sites-showcase-v2-site-type').toggleClass('open');
			$('.astra-sites-showcase-v2-site-type .filter-type').toggle();
		},

		_toggle_filters: function() {
			$('.filters-wrap').toggleClass('open');
			$('.filters-list').toggle();
		},

		_get_types: function() {
			var types = [];
			$('.filter-type input:radio:checked').each(function() {
			    if( $(this).val().length ) {
			    	types[ $(this).val() ] = $(this).attr('title');
			    }
			});
			return types;
		},

		_get_categories: function() {
			var categories = [];
			$('.filter-category input:radio:checked').each(function() {
			    if( $(this).val().length ) {
			    	categories[ $(this).val() ] = $(this).attr('title');
			    }
			});
			return categories;
		},

		_get_page_builders: function() {
			var page_builders = [];

			var page_builder = $('.selected-page-builder').attr('slug') || '';
			var current_page_builder = $('.selected-page-builder').attr('title') || '';
			if( page_builder === 'block-editor' ) {
				page_builder = 'gutenberg';
			}
			page_builders[ page_builder ] = current_page_builder;

			return page_builders;
		},

		_suggest_category: function() {

			if( $('.filter-category input:radio:checked').length ) {
				$('.filter-category li').removeClass('active');
				$('.filter-category input:radio:checked').parents('li').addClass('active');
			}

			var category = $('.filter-category input:radio:checked').val() || '';
			$('#astra-sites-showcase-v2-search-input').val( category ).addClass('has-input');

			var items = AstraSitesShowcaseV2._get_sites_by_search_term( category );;

			if( ! AstraSitesShowcaseV2.isEmpty( items ) ) {
				AstraSitesShowcaseV2.add_sites( items );
			} else {
				$('#astra-sites-showcase-v2-list').html( wp.template('astra-sites-showcase-no-sites') );
			}

			AstraSitesShowcaseV2._change_urls();
		},

		_toggle_selected_filters: function() {
			var output = '';

			$('#astra-sites-showcase-v2-search-input').val( '' );
			$('.filter-category li').removeClass('active');

			var current_page_builder = $('.filter-page-builder input:radio:checked').attr( 'title' ) || '';
			var page_builder = $('.filter-page-builder input:radio:checked').val() || '';			
			if( current_page_builder ) {
				$('.selected-filter .selected-page-builder').text( current_page_builder );
				var current_page_builder_image_src = $('.filter-page-builder input:radio:checked').parents('li').find('img').attr('src') || '';
				$('.selected-filter .selected-page-builder-image').find('img').attr('src', current_page_builder_image_src );

				$('.selected-page-builder')
					.attr('slug', page_builder)
					.attr('title', current_page_builder);
			}

			var type = $('.filter-type input:radio:checked').attr( 'title' ) || '';
			if( type ) {
				$('.selected-site-type .filter-label').text( type );
			}

			var items = AstraSitesShowcaseV2._get_sites_by_search_term( '' );

			if( ! AstraSitesShowcaseV2.isEmpty( items ) ) {
				AstraSitesShowcaseV2.add_sites( items );
			} else {
				$('#astra-sites-showcase-v2-list').html( wp.template('astra-sites-showcase-no-sites') );
			}

			AstraSitesShowcaseV2._change_urls();
		},

		_show_sites: function() {

			if( ! $('#astra-sites-showcase-v2-list').length ) {
				return;
			}

			if( Object.keys( AstraShowcaseVars.sites ).length ) {
				var type         = AstraSitesShowcaseV2._getParamFromURL('type') || '';
				var page_builder = AstraSitesShowcaseV2._getParamFromURL('page-builder') || '';

				if( type ) {
					var type = ( 'agency' === type ) ? 'agency-mini' : type;
					if( $('.filter-type input:radio[value="'+type+'"]').length ) {
						$('.filter-type input:radio').attr('checked', false);
						$('.filter-type input:radio[value="'+type+'"]').attr('checked', true);
					}

					var type = $('.filter-type input:radio[value="'+type+'"]').attr( 'title' ) || '';
					if( type ) {
						$('.selected-site-type .filter-label').text( type );
					}
				}

				if( page_builder ) {
					

					if( $('.filter-page-builder input:radio[value="'+page_builder+'"]').length ) {
						$('.filter-page-builder input:radio').attr('checked', false);
						$('.filter-page-builder input:radio[value="'+page_builder+'"]').attr('checked', true);

						var current_page_builder = $('.filter-page-builder input:radio[value="'+page_builder+'"]').attr( 'title' ) || '';
						if( current_page_builder ) {
							$('.selected-filter .selected-page-builder').text( current_page_builder );
						}

						$('.selected-page-builder')
							.attr('slug', page_builder)
							.attr('title', current_page_builder);						

						var current_page_builder_image_src = $('.filter-page-builder input:radio[value="'+page_builder+'"]').parents('li').find('img').attr('src') || '';
						if( current_page_builder_image_src ) {
							$('.selected-filter .selected-page-builder-image').find('img').attr('src', current_page_builder_image_src );
						}
					}
				}

				var search_term = AstraSitesShowcaseV2._getParamFromURL('search-term');
				if( search_term ) {
					var items = AstraSitesShowcaseV2._get_sites_by_search_term( search_term );
					$('#astra-sites-showcase-v2-search-input').val( search_term ).addClass('has-input');
					if( ! AstraSitesShowcaseV2.isEmpty( items ) ) {
						AstraSitesShowcaseV2.add_sites( items );
					} else {
						$('#astra-sites-showcase-v2-list').html( wp.template('astra-sites-showcase-no-sites') );
					}
				} else {
					AstraSitesShowcaseV2._toggle_selected_filters();
				}
			}
		},

		/**
		 * Change category URLs.
		 */
		_change_urls: function() {

			if( AstraSitesShowcaseV2.hideQueryString === 'yes' ) {
				return;
			}

			var url_params = AstraSitesShowcaseV2._getQueryStrings();
			delete url_params[''];		// Removed extra empty object.
			delete url_params['page-builder'];
			delete url_params['type'];
			delete url_params['search-term'];

			var current_url = window.location.href;
			var root_url = current_url.substr(0, current_url.indexOf('?'));
			if( '' === root_url ) {
				root_url = current_url;
			}

			var types         = AstraSitesShowcaseV2._get_types();
			var page_builders = AstraSitesShowcaseV2._get_page_builders();

			if( ! AstraSitesShowcaseV2.isEmpty( types ) ) {
				types_slugs = ( Object.keys(types).length ) ? Object.keys(types) : [];
				if( types_slugs.length ) {
					var type = ( 'agency-mini' === types_slugs[0] ) ? 'agency' : types_slugs[0];
					url_params['type'] = type;
				}
			}

			if( ! AstraSitesShowcaseV2.isEmpty( page_builders ) ) {
				page_builders_slugs = ( Object.keys(page_builders).length ) ? Object.keys(page_builders) : [];
				if( page_builders_slugs.length ) {
					if( page_builders_slugs[0] === 'gutenberg' ) {
						page_builders_slugs[0] = 'block-editor';
					}
					url_params['page-builder'] = page_builders_slugs[0];
				}
			}

			var search_term = $('#astra-sites-showcase-v2-search-input').val() || '';
			if( search_term ) {
				url_params['search-term'] = search_term;
			}

			var current_url_separator = ( root_url.indexOf( "?" ) === -1 ) ? "?" : "&";
			var new_url = root_url + current_url_separator + decodeURIComponent( $.param( url_params ) );

			// Change URL.
			AstraSitesShowcaseV2._changeURL( new_url );
		},

		/**
		 * Clean the URL.
		 *
		 * @param  string url URL string.
		 * @return string     Change the current URL.
		 */
		_changeURL: function( url )
		{
			var title = $(document).find("title").text();
			History.pushState(null, title, url);
		},

		/**
		 * Get query strings.
		 */
		_getQueryStrings: function( str )
		{
			return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
		},

		add_sites: function( data ) {
			var template = wp.template( 'astra-sites-page-builder-sites' );
			$('#astra-sites-showcase-v2-list').html( template( data ) );
    		AstraSitesShowcaseV2._load_large_images();
    		$( document ).trigger( 'astra-sites-added-sites' );
		},

		/**
		 * load large image
		 *
		 * @return {[type]} [description]
		 */
		_load_large_image: function( el ) {
			if( el.hasClass('loaded') ) {
				return;
			}

			if( el.parents('.astra-theme').isInViewport() ) {
				var large_img_url = el.data('src') || '';
				var imgLarge = new Image();
				imgLarge.src = large_img_url;
				imgLarge.onload = function () {
					el.removeClass('loading');
					el.addClass('loaded');
					el.css('background-image', 'url(\''+imgLarge.src+'\'' );
				};
			}
		},

		_load_large_images: function() {
			// $('.theme-screenshot').each(function( key, el) {
			// 	AstraSitesShowcaseV2._load_large_image( $(el) );
			// });
		},

		/**
		 * Get URL param.
		 */
		_getParamFromURL: function(name, url)
		{
		    if (!url) url = window.location.href;
		    name = name.replace(/[\[\]]/g, "\\$&");
		    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		        results = regex.exec(url);
		    if (!results) return null;
		    if (!results[2]) return '';
		    return decodeURIComponent(results[2].replace(/\+/g, " "));
		},

		_get_sites_by_search_term: function( search_term ) {

			var items = [];
			var new_list = [];
			var types         = AstraSitesShowcaseV2._get_types();
			// var categories    = AstraSitesShowcaseV2._get_categories();
			var page_builders = AstraSitesShowcaseV2._get_page_builders();

			// var category_slugs = [];
			var types_slugs = [];
			var page_builder_slugs = [];
			if( ! AstraSitesShowcaseV2.isEmpty( types ) ) {
				types_slugs = ( Object.keys(types).length ) ? Object.keys(types) : [];
			}

			// if( ! AstraSitesShowcaseV2.isEmpty( categories ) ) {
			// 	category_slugs = ( Object.keys(categories).length ) ? Object.keys(categories) : [];
			// }

			if( AstraSitesShowcaseV2.has_default_page_builder ) {
				page_builder_slugs = [ AstraSitesShowcaseV2.has_default_page_builder ];
			} else {
				if( ! AstraSitesShowcaseV2.isEmpty( page_builders ) ) {
					page_builder_slugs = ( Object.keys(page_builders).length ) ? Object.keys(page_builders) : [];
				}
			}

			if( search_term ) {
				search_term = search_term.toLowerCase();
			}

			for( site_id in AstraShowcaseVars.sites ) {

				var current_site = AstraShowcaseVars.sites[site_id];
				var current_temp_item = [];

				// Check in site title.
				if( current_site['title'] ) {
					var site_title = AstraSitesShowcaseV2._unescape_lower( current_site['title'] );

					if( site_title.toLowerCase().includes( search_term ) ) {
						current_temp_item[site_id] = current_site;
						current_temp_item[site_id]['type'] = 'site';
						current_temp_item[site_id]['site_id'] = site_id;
						current_temp_item[site_id]['pages-count'] = Object.keys( current_site['pages'] ).length;
					}
				}

				// Check in site tags.
				if( Object.keys( current_site['astra-sites-tag'] ).length ) {
					for( site_tag_id in current_site['astra-sites-tag'] ) {
						var tag_title = current_site['astra-sites-tag'][site_tag_id];
							tag_title = AstraSitesShowcaseV2._unescape_lower( tag_title.replace('-', ' ') );

						if( tag_title.toLowerCase().includes( search_term ) ) {
							current_temp_item[site_id] = current_site;
							current_temp_item[site_id]['type'] = 'site';
							current_temp_item[site_id]['site_id'] = site_id;
							current_temp_item[site_id]['pages-count'] = Object.keys( current_site['pages'] ).length;
						}
					}
				}

				// Check in site tags.
				if( Object.keys( current_site['astra-site-category'] ).length ) {
					for( site_tag_id in current_site['astra-site-category'] ) {
						var tag_title = current_site['astra-site-category'][site_tag_id];
							tag_title = AstraSitesShowcaseV2._unescape_lower( tag_title.replace('-', ' ') );

						if( tag_title.toLowerCase().includes( search_term ) ) {
							current_temp_item[site_id] = current_site;
							current_temp_item[site_id]['type'] = 'site';
							current_temp_item[site_id]['site_id'] = site_id;
							current_temp_item[site_id]['pages-count'] = Object.keys( current_site['pages'] ).length;
						}
					}
				}

				if( ! AstraSitesShowcaseV2.isEmpty( current_temp_item ) ) {
					if(
						( types_slugs.length && AstraSitesShowcaseV2.checkSiteType( current_site['astra-sites-type'], types_slugs[0] ) ) &&
						( page_builder_slugs.length && (page_builder_slugs.indexOf( current_site['astra-site-page-builder'] ) > -1) ) ) {
						items[site_id] = current_temp_item[ site_id ];

						// Filter by site type (free/agency-mini).
					} else if( page_builder_slugs.length <= 0 && types_slugs.length && AstraSitesShowcaseV2.checkSiteType( current_site['astra-sites-type'], types_slugs[0] ) ) {
						items[site_id] = current_temp_item[ site_id ];

						// Only Page Builder.
					} else if(
						( types_slugs.length <= 0 ) &&
						page_builder_slugs.length && (page_builder_slugs.indexOf( current_site['astra-site-page-builder'] ) > -1) ) {
						items[site_id] = current_temp_item[ site_id ];
					} else if( types_slugs.length <= 0 && page_builder_slugs.length <= 0 ) {
						items[site_id] = current_temp_item[ site_id ];
					}
				}



				// // Check in page title.
				// if( Object.keys( current_site['pages'] ).length ) {
				// 	var pages = current_site['pages'];

				// 	for( page_id in pages ) {

				// 		// Check in site title.
				// 		if( pages[page_id]['title'] ) {

				// 			var page_title = AstraSitesShowcaseV2._unescape_lower( pages[page_id]['title'] );

				// 			if( page_title.toLowerCase().includes( search_term ) ) {
				// 				items[page_id] = pages[page_id];
				// 				items[page_id]['type'] = 'page';
				// 				items[page_id]['site_id'] = site_id;
				// 				items[page_id]['astra-sites-type'] = current_site['astra-sites-type'] || '';
				// 				items[page_id]['site-title'] = current_site['title'] || '';
				// 				items[page_id]['pages-count'] = 0;
				// 			}
				// 		}

				// 		// Check in site tags.
				// 		if( Object.keys( pages[page_id]['astra-sites-tag'] ).length ) {
				// 			for( page_tag_id in pages[page_id]['astra-sites-tag'] ) {
				// 				var page_tag_title = pages[page_id]['astra-sites-tag'][page_tag_id];
				// 					page_tag_title = AstraSitesShowcaseV2._unescape_lower( page_tag_title.replace('-', ' ') );
				// 				if( page_tag_title.toLowerCase().includes( search_term ) ) {
				// 					items[page_id] = pages[page_id];
				// 					items[page_id]['type'] = 'page';
				// 					items[page_id]['site_id'] = site_id;
				// 					items[page_id]['astra-sites-type'] = current_site['astra-sites-type'] || '';
				// 					items[page_id]['site-title'] = current_site['title'] || '';
				// 					items[page_id]['pages-count'] = 0;
				// 				}
				// 			}
				// 		}

				// 	}
				// }
			}

			for( item_id in items ) {
				var title = _.unescape( items[item_id]['title'] );

				// @todo check why below character not escape with function _.unescape();
				title = title.replace('&#8211;', '-' );

				new_list.push( title );
			}

			AstraSitesShowcaseV2.autoComplete = new_list;
			AstraSitesShowcaseV2._autocomplete();

			return items;
		},

		checkSiteType( siteType, type ) {
			if ( siteType === type ){
				return true;
			} else if ( siteType !== 'free' && type !== 'free' ) {
				return true;
			}
			return false;
		},

		isEmpty: function(obj) {
		    for(var key in obj) {
		        if(obj.hasOwnProperty(key))
		            return false;
		    }
		    return true;
		},

		_unescape: function( input_string ) {
			var title = _.unescape( input_string );

			// @todo check why below character not escape with function _.unescape();
			title = title.replace('&#8211;', '-' );
			title = title.replace('&#8217;', "'" );

			return title;
		},

		_unescape_lower: function( input_string ) {
			var input_string = AstraSitesShowcaseV2._unescape( input_string );
			return input_string.toLowerCase();
		}
	};



	/**
	 * Initialize AstraSitesShowcaseV2
	 */
	$(function(){
		AstraSitesShowcaseV2.init();
	});

})(jQuery);
