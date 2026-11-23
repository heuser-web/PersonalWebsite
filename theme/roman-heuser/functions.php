<?php
/**
 * Heuser theme functions.
 *
 * @package roman-heuser
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'RH_VERSION', '2.2.0' );

/* -------------------------------------------------------------------------
 * 1. Theme setup
 * ---------------------------------------------------------------------- */
function rh_setup() {

	load_theme_textdomain( 'roman-heuser', get_template_directory() . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'style.css' );

	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);

	// The name logo goes in the header via Appearance > Customize > Site Identity.
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 400,
			'width'       => 1440,
			'flex-height' => true,
			'flex-width'  => true,
			'header-text' => array( 'site-title', 'site-description' ),
		)
	);

	// One menu location. The project requires exactly one custom menu.
	register_nav_menus(
		array(
			'primary' => __( 'Primary Menu (Home | About Me | Resume | Gallery | Blog)', 'roman-heuser' ),
		)
	);

	add_image_size( 'rh-card', 900, 600, true );
	add_image_size( 'rh-hero', 2000, 1200, true );

	// Content width used by oEmbeds and wide images.
	if ( ! isset( $GLOBALS['content_width'] ) ) {
		$GLOBALS['content_width'] = 1200;
	}
}
add_action( 'after_setup_theme', 'rh_setup' );

/* -------------------------------------------------------------------------
 * 2. Assets
 * ---------------------------------------------------------------------- */
function rh_assets() {

	// Display + body faces. Loaded from Google Fonts with a full local fallback
	// stack in the CSS, so the site still reads correctly if fonts are blocked.
	wp_enqueue_style(
		'rh-fonts',
		'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style( 'rh-style', get_stylesheet_uri(), array( 'rh-fonts' ), RH_VERSION );

	wp_enqueue_script( 'rh-theme', get_template_directory_uri() . '/assets/js/theme.js', array(), RH_VERSION, true );

	/*
	 * Cinematic layer — the opening crawl, glass surfaces, the WebGL galaxy and
	 * the 3D tilt. Additive by design: delete these two files and the site falls
	 * back to the plain theme with nothing broken.
	 */
	wp_enqueue_style( 'rh-cinematic', get_template_directory_uri() . '/assets/css/cinematic.css', array( 'rh-style' ), RH_VERSION );
	wp_enqueue_script( 'rh-cinematic', get_template_directory_uri() . '/assets/js/cinematic.js', array(), RH_VERSION, true );

	/*
	 * The Drive — the scroll-driven world. Also additive: without the rd-on body
	 * class (rh_js_class, below) drive.js exits at once and drive.css matches
	 * nothing. three.rh.min.js is a trimmed Three.js r170 build (MIT).
	 */
	$rh_js = get_template_directory_uri() . '/assets/js/';
	wp_enqueue_style( 'rh-drive', get_template_directory_uri() . '/assets/css/drive.css', array( 'rh-cinematic' ), RH_VERSION );
	wp_enqueue_script( 'rh-three', $rh_js . 'vendor/three.rh.min.js', array(), '0.170.0', true );
	wp_enqueue_script( 'rh-drive-world', $rh_js . 'drive-world.js', array( 'rh-three' ), RH_VERSION, true );
	wp_enqueue_script( 'rh-drive', $rh_js . 'drive.js', array( 'rh-drive-world', 'rh-cinematic' ), RH_VERSION, true );

	// The terminal beat's printed line is editable in the Customizer.
	wp_localize_script(
		'rh-cinematic',
		'RH_INTRO',
		array( 'boot' => wp_strip_all_tags( (string) rh_opt( 'rh_intro_boot' ) ) )
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'rh_assets' );

/** Add a `js` class so reveal animations only hide content when JS can show it again. */
function rh_js_class( $classes ) {
	$classes[] = 'no-js';
	$classes[] = 'rd-on';
	if ( is_front_page() ) {
		$classes[] = 'rd-home';
	}
	return $classes;
}
add_filter( 'body_class', 'rh_js_class' );

/** Which stretch of road runs behind an inner page, as "from,to" scene numbers. */
function rh_drive_range() {
	$map = array(
		'about-me'     => '1,7.3',
		'resume'       => '2.9,4.3',
		'gallery'      => '5,7.2',
		'blog'         => '3.9,5.2',
		'excel-helper' => '0.9,2.1',
	);
	if ( is_page() ) {
		$slug = get_post_field( 'post_name', get_queried_object_id() );
		if ( isset( $map[ $slug ] ) ) {
			return $map[ $slug ];
		}
	}
	if ( is_home() || is_single() || is_archive() ) {
		return $map['blog'];
	}
	return '1,4';
}

/** The Drive markup with its tokens filled in. Every value is escaped here. */
function rh_drive_markup( $logo_url ) {
	$file = get_template_directory() . '/parts/drive.html';
	if ( ! is_readable( $file ) ) {
		return '';
	}
	$html = file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local theme file.

	$hero = get_theme_mod( 'rh_hero_image' );
	$html = strtr(
		$html,
		array(
			'{{eyebrow}}'  => esc_html( wp_strip_all_tags( rh_opt( 'rh_hero_eyebrow' ) ) ),
			'{{title}}'    => wp_kses_post( rh_opt( 'rh_hero_title' ) ),
			'{{sub}}'      => wp_kses_post( rh_opt( 'rh_hero_sub' ) ),
			'{{cta1_txt}}' => esc_html( rh_opt( 'rh_hero_cta1_txt' ) ),
			'{{cta1_url}}' => esc_url( rh_opt( 'rh_hero_cta1_url' ) ),
			'{{cta2_txt}}' => esc_html( rh_opt( 'rh_hero_cta2_txt' ) ),
			'{{cta2_url}}' => esc_url( rh_opt( 'rh_hero_cta2_url' ) ),
			'{{logo}}'     => esc_url( $logo_url ),
			'{{img:plate-vegas-sm.webp}}' => esc_url( $hero ? $hero : rh_img( 'plate-vegas-sm.webp' ) ),
		)
	);
	$html = preg_replace_callback(
		'/\{\{img:([a-z0-9\/._-]+)\}\}/i',
		function ( $m ) {
			return esc_url( rh_img( $m[1] ) );
		},
		$html
	);
	return preg_replace_callback(
		'/\{\{url:([^}]+)\}\}/',
		function ( $m ) {
			return esc_url( rh_page_url_by_title( $m[1] ) );
		},
		$html
	);
}

/* -------------------------------------------------------------------------
 * 3. Widget areas
 * Three footer columns instead of a blog sidebar full of Archives/Meta.
 * ---------------------------------------------------------------------- */
function rh_widgets() {

	$common = array(
		'before_widget' => '<div id="%1$s" class="widget %2$s">',
		'after_widget'  => '</div>',
		'before_title'  => '<h2 class="widget-title">',
		'after_title'   => '</h2>',
	);

	register_sidebar(
		array_merge(
			$common,
			array(
				'name'        => __( 'Footer — Column 2', 'roman-heuser' ),
				'id'          => 'footer-2',
				'description' => __( 'Middle footer column. Good for a Navigation Menu widget or a short "Explore" list.', 'roman-heuser' ),
			)
		)
	);

	register_sidebar(
		array_merge(
			$common,
			array(
				'name'        => __( 'Footer — Column 3', 'roman-heuser' ),
				'id'          => 'footer-3',
				'description' => __( 'Right footer column. Good for a Text widget with contact details.', 'roman-heuser' ),
			)
		)
	);
}
add_action( 'widgets_init', 'rh_widgets' );

/**
 * Strip the widgets a personal site should not show.
 *
 * The project brief explicitly calls out Search, Recent Posts, Recent Comments,
 * Archives, Categories and Meta as clutter. Unregistering them means they can
 * never be added back by accident.
 */
function rh_unregister_default_widgets() {
	$noise = array(
		'WP_Widget_Recent_Comments',
		'WP_Widget_Archives',
		'WP_Widget_Meta',
		'WP_Widget_Calendar',
		'WP_Widget_Tag_Cloud',
		'WP_Widget_RSS',
	);
	foreach ( $noise as $widget ) {
		if ( class_exists( $widget ) ) {
			unregister_widget( $widget );
		}
	}
}
add_action( 'widgets_init', 'rh_unregister_default_widgets', 11 );

/* -------------------------------------------------------------------------
 * 4. Navigation helpers
 * ---------------------------------------------------------------------- */

/**
 * Resolve a page permalink from its title.
 *
 * get_page_by_title() is deprecated as of WP 6.2, so this uses WP_Query and
 * falls back to the home URL when the page has not been created yet.
 *
 * @param string $title Page title to look up.
 * @return string Permalink or home URL.
 */
function rh_page_url_by_title( $title ) {
	$found = get_posts(
		array(
			'post_type'              => 'page',
			'title'                  => $title,
			'post_status'            => 'publish',
			'numberposts'            => 1,
			'fields'                 => 'ids',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		)
	);

	return $found ? get_permalink( $found[0] ) : home_url( '/' );
}

/**
 * Fallback menu shown only until the real custom menu is assigned.
 * It renders the five required pages in the required order.
 */
function rh_menu_fallback() {
	$wanted = array( 'Home', 'About Me', 'Resume', 'Gallery', 'Blog' );

	echo '<ul id="rh-primary-menu">';
	foreach ( $wanted as $title ) {
		$url = rh_page_url_by_title( $title );
		printf(
			'<li class="menu-item"><a href="%1$s">%2$s</a></li>',
			esc_url( $url ),
			esc_html( $title )
		);
	}
	echo '</ul>';
	echo '<p class="screen-reader-text">' . esc_html__( 'Fallback menu — assign a custom menu under Appearance > Menus.', 'roman-heuser' ) . '</p>';
}

/* -------------------------------------------------------------------------
 * 5. Customizer
 * ---------------------------------------------------------------------- */
require get_template_directory() . '/inc/customizer.php';

/* -------------------------------------------------------------------------
 * 6. Comment rendering
 * ---------------------------------------------------------------------- */
function rh_comment( $comment, $args, $depth ) {
	$tag = ( 'div' === $args['style'] ) ? 'div' : 'li';
	?>
	<<?php echo esc_attr( $tag ); ?> id="comment-<?php comment_ID(); ?>" <?php comment_class( 'rh-comment' ); ?>>
		<article id="div-comment-<?php comment_ID(); ?>" class="comment-body">
			<footer class="comment-meta">
				<?php echo get_avatar( $comment, 52 ); ?>
				<div>
					<b class="fn"><?php echo get_comment_author_link( $comment ); ?></b>
					<div class="comment-metadata">
						<?php
						printf(
							/* translators: %s: comment date */
							esc_html__( '%s', 'roman-heuser' ),
							esc_html( get_comment_date( '', $comment ) )
						);
						?>
					</div>
				</div>
			</footer>

			<?php if ( '0' === $comment->comment_approved ) : ?>
				<p class="comment-awaiting-moderation"><em><?php esc_html_e( 'Your comment is awaiting moderation.', 'roman-heuser' ); ?></em></p>
			<?php endif; ?>

			<div class="comment-content"><?php comment_text(); ?></div>

			<div class="reply">
				<?php
				comment_reply_link(
					array_merge(
						$args,
						array(
							'add_below' => 'div-comment',
							'depth'     => $depth,
							'max_depth' => $args['max_depth'],
						)
					)
				);
				?>
			</div>
		</article>
	<?php
	// Closing tag is emitted by wp_list_comments.
}

/* -------------------------------------------------------------------------
 * 7. Small quality-of-life fixes
 * ---------------------------------------------------------------------- */

/** A readable excerpt length for the blog cards. */
function rh_excerpt_length() {
	return 32;
}
add_filter( 'excerpt_length', 'rh_excerpt_length' );

function rh_excerpt_more() {
	return '&hellip;';
}
add_filter( 'excerpt_more', 'rh_excerpt_more' );

/** Let the theme style plugin embeds (PDF viewers, chat widgets) predictably. */
function rh_body_classes( $classes ) {
	if ( is_page() ) {
		$classes[] = 'rh-page-' . sanitize_html_class( get_post_field( 'post_name', get_queried_object_id() ) );
	}
	return $classes;
}
add_filter( 'body_class', 'rh_body_classes' );

/**
 * Bundled artwork the theme falls back to when nothing has been uploaded yet.
 *
 * @param string $name File name inside assets/img.
 * @return string URL.
 */
function rh_img( $name ) {
	return get_template_directory_uri() . '/assets/img/' . $name;
}

/**
 * Page-to-page transitions: the opt-in has to be inline.
 *
 * Browsers decide whether a new page takes part before external stylesheets have
 * applied, so the same rule inside drive.css was read too late and every
 * transition was cancelled. RHVT lets drive.js wait for the wipe to finish
 * before it builds the 3D scene.
 */
function rh_view_transition() {
	echo '<style>@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}</style>' . "\n";
	echo "<script>addEventListener('pagereveal',function(e){window.RHVT=e.viewTransition?e.viewTransition.finished:null})</script>\n";
}
add_action( 'wp_head', 'rh_view_transition', 0 );

/** Browser-tab icon until one is set under Customize > Site Identity. */
function rh_site_icon_fallback() {
	if ( ! has_site_icon() ) {
		printf( '<link rel="icon" href="%s" sizes="512x512">' . "\n", esc_url( rh_img( 'site-icon.png' ) ) );
	}
}
add_action( 'wp_head', 'rh_site_icon_fallback' );

/** Advertise the pingback endpoint on posts that accept pings. */
function rh_pingback_header() {
	if ( is_singular() && pings_open() ) {
		printf( '<link rel="pingback" href="%s">' . "\n", esc_url( get_bloginfo( 'pingback_url' ) ) );
	}
}
add_action( 'wp_head', 'rh_pingback_header' );

/**
 * Rough reading-time label for the post header.
 *
 * @param string $content Raw post content.
 * @return string e.g. "4 minutes".
 */
function rh_reading_time( $content ) {
	$words   = str_word_count( wp_strip_all_tags( (string) $content ) );
	$minutes = max( 1, (int) ceil( $words / 200 ) );

	return sprintf(
		/* translators: %s: number of minutes */
		_n( '%s minute', '%s minutes', $minutes, 'roman-heuser' ),
		number_format_i18n( $minutes )
	);
}
