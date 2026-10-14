<?php
/**
 * Customizer options.
 *
 * Everything the site owner should be able to change without touching code:
 * the hero copy, the hero background image, the accent color, and the social
 * links used by the footer and the Social Media plugin fallback.
 *
 * @package roman-heuser
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** All customizer settings, declared once and reused by register + output. */
function rh_customizer_fields() {
	return array(
		// Hero.
		'rh_hero_eyebrow'  => array( 'default' => 'Las Vegas · University of Nevada, Reno', 'label' => 'Hero eyebrow', 'type' => 'text', 'section' => 'rh_hero' ),
		'rh_hero_title'    => array( 'default' => 'I build things that <em>ship</em>.', 'label' => 'Hero headline (HTML allowed — wrap a word in &lt;em&gt; for the brass italic)', 'type' => 'textarea', 'section' => 'rh_hero' ),
		'rh_hero_sub'      => array( 'default' => 'Founder of GoMojo and GoInvest. Frontend design lead at TagData. Business freshman at the University of Nevada, Reno — I turn ideas into working software, usually faster and for less money than anyone expects.', 'label' => 'Hero subtitle', 'type' => 'textarea', 'section' => 'rh_hero' ),
		'rh_hero_cta1_txt' => array( 'default' => 'Read my story', 'label' => 'Primary button label', 'type' => 'text', 'section' => 'rh_hero' ),
		'rh_hero_cta1_url' => array( 'default' => '/about-me/', 'label' => 'Primary button link', 'type' => 'url', 'section' => 'rh_hero' ),
		'rh_hero_cta2_txt' => array( 'default' => 'View my resume', 'label' => 'Secondary button label', 'type' => 'text', 'section' => 'rh_hero' ),
		'rh_hero_cta2_url' => array( 'default' => '/resume/', 'label' => 'Secondary button link', 'type' => 'url', 'section' => 'rh_hero' ),

		// Opening sequence.
		'rh_intro_boot'  => array( 'default' => 'roman heuser · founder, builder, student', 'label' => 'Terminal line (printed after "$ whoami")', 'type' => 'text', 'section' => 'rh_intro' ),
		'rh_intro_name'  => array( 'default' => 'ROMAN HEUSER', 'label' => 'Name card', 'type' => 'text', 'section' => 'rh_intro' ),
		'rh_intro_c1'    => array( 'default' => "Three products.|All of them live.|Not pitched · not planned · shipped", 'label' => 'Card 1 — lead | highlight | subtitle', 'type' => 'textarea', 'section' => 'rh_intro' ),
		'rh_intro_c2'    => array( 'default' => "A |$3.5M| company handed me the frontend.|Full authority over the redesign", 'label' => 'Card 2 — see card 1 format', 'type' => 'textarea', 'section' => 'rh_intro' ),
		'rh_intro_c3'    => array( 'default' => "Seven agents.|Six seconds.|One perfect night in Las Vegas", 'label' => 'Card 3 — see card 1 format', 'type' => 'textarea', 'section' => 'rh_intro' ),
		'rh_intro_tag'   => array( 'default' => 'Las Vegas &rarr; Reno &middot; 2026', 'label' => 'Sign-off line', 'type' => 'text', 'section' => 'rh_intro' ),

		// Footer.
		'rh_footer_blurb'  => array( 'default' => 'Built from scratch on a self-hosted WordPress install — custom theme, no page builder. Thanks for stopping by.', 'label' => 'Footer blurb', 'type' => 'textarea', 'section' => 'rh_footer' ),
		'rh_contact_email' => array( 'default' => '', 'label' => 'Contact email', 'type' => 'text', 'section' => 'rh_footer' ),

		// Social.
		'rh_social_linkedin' => array( 'default' => '', 'label' => 'LinkedIn URL', 'type' => 'url', 'section' => 'rh_social' ),
		'rh_social_github'   => array( 'default' => '', 'label' => 'GitHub URL', 'type' => 'url', 'section' => 'rh_social' ),
		'rh_social_instagram'=> array( 'default' => '', 'label' => 'Instagram URL', 'type' => 'url', 'section' => 'rh_social' ),
		'rh_social_x'        => array( 'default' => '', 'label' => 'X / Twitter URL', 'type' => 'url', 'section' => 'rh_social' ),
		'rh_social_youtube'  => array( 'default' => '', 'label' => 'YouTube URL', 'type' => 'url', 'section' => 'rh_social' ),
	);
}

/** Read one setting with its declared default. */
function rh_opt( $key ) {
	$fields = rh_customizer_fields();
	$default = isset( $fields[ $key ]['default'] ) ? $fields[ $key ]['default'] : '';
	return get_theme_mod( $key, $default );
}

function rh_customize_register( $wp_customize ) {

	$wp_customize->add_panel(
		'rh_panel',
		array(
			'title'    => __( 'Heuser Theme Options', 'roman-heuser' ),
			'priority' => 20,
		)
	);

	$sections = array(
		'rh_hero'   => __( 'Home Hero', 'roman-heuser' ),
		'rh_intro'  => __( 'Opening Sequence', 'roman-heuser' ),
		'rh_social' => __( 'Social Links', 'roman-heuser' ),
		'rh_footer' => __( 'Footer', 'roman-heuser' ),
		'rh_color'  => __( 'Colors', 'roman-heuser' ),
	);
	foreach ( $sections as $id => $title ) {
		$wp_customize->add_section( $id, array( 'title' => $title, 'panel' => 'rh_panel' ) );
	}

	// Text-ish fields.
	foreach ( rh_customizer_fields() as $key => $f ) {
		$sanitize = ( 'url' === $f['type'] ) ? 'esc_url_raw' : 'wp_kses_post';

		$wp_customize->add_setting(
			$key,
			array(
				'default'           => $f['default'],
				'sanitize_callback' => $sanitize,
				'transport'         => 'refresh',
			)
		);
		$wp_customize->add_control(
			$key,
			array(
				'label'   => $f['label'],
				'section' => $f['section'],
				'type'    => ( 'textarea' === $f['type'] ) ? 'textarea' : 'text',
			)
		);
	}

	// Hero background image.
	$wp_customize->add_setting( 'rh_hero_image', array( 'sanitize_callback' => 'esc_url_raw' ) );
	$wp_customize->add_control(
		new WP_Customize_Image_Control(
			$wp_customize,
			'rh_hero_image',
			array(
				'label'       => __( 'Hero background image', 'roman-heuser' ),
				'description' => __( 'Wide photo, 2000px or more. It sits behind a dark wash so any photo stays readable.', 'roman-heuser' ),
				'section'     => 'rh_hero',
			)
		)
	);

	// Accent color.
	$wp_customize->add_setting(
		'rh_accent',
		array(
			'default'           => '#C9A227',
			'sanitize_callback' => 'sanitize_hex_color',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Color_Control(
			$wp_customize,
			'rh_accent',
			array(
				'label'       => __( 'Accent color', 'roman-heuser' ),
				'description' => __( 'Drives buttons, rules, eyebrows and link hovers across the whole site.', 'roman-heuser' ),
				'section'     => 'rh_color',
			)
		)
	);
}
add_action( 'customize_register', 'rh_customize_register' );

/** Push the chosen accent color into the token layer. */
function rh_customizer_css() {
	$accent = get_theme_mod( 'rh_accent', '#C9A227' );
	if ( '#C9A227' === $accent || ! $accent ) {
		return;
	}
	printf(
		'<style id="rh-customizer">:root{--rh-brass:%1$s;--rh-accent:%1$s;}</style>' . "\n",
		esc_attr( $accent )
	);
}
add_action( 'wp_head', 'rh_customizer_css', 20 );

/**
 * Render one intro statement card from a pipe-delimited setting.
 *
 * Format: lead | highlight | subtitle  (highlight is optional — use two pipes
 * to skip it, e.g. "Seven agents.||One perfect night").
 *
 * @param string $key   Setting key.
 * @param string $beat  data-beat value.
 */
function rh_intro_card( $key, $beat ) {
	$raw = rh_opt( $key );
	if ( ! $raw ) {
		return;
	}
	$parts = array_map( 'trim', explode( '|', (string) $raw ) );
	$lead  = isset( $parts[0] ) ? $parts[0] : '';
	$hi    = isset( $parts[1] ) ? $parts[1] : '';
	$sub   = isset( $parts[2] ) ? $parts[2] : '';
	?>
	<div class="rh-beat rh-beat--card" data-beat="<?php echo esc_attr( $beat ); ?>">
		<p class="rh-card__lead">
			<?php echo wp_kses_post( $lead ); ?>
			<?php if ( $hi ) : ?><br><b><?php echo wp_kses_post( $hi ); ?></b><?php endif; ?>
		</p>
		<div class="rh-card__rule"></div>
		<?php if ( $sub ) : ?>
			<p class="rh-card__sub"><?php echo wp_kses_post( $sub ); ?></p>
		<?php endif; ?>
	</div>
	<?php
}

/** Social links that are actually filled in, with their inline icons. */
function rh_social_links() {
	$map = array(
		'rh_social_linkedin'  => array( 'LinkedIn', 'M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8h4.52v14H.24V8zm7.4 0h4.33v1.92h.06c.6-1.14 2.08-2.34 4.28-2.34 4.58 0 5.42 3.01 5.42 6.93V22h-4.52v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V22H7.64V8z' ),
		'rh_social_github'    => array( 'GitHub', 'M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58A12.01 12.01 0 0024 12.5C24 5.87 18.63.5 12 .5z' ),
		'rh_social_instagram' => array( 'Instagram', 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 01-1.38-.9 3.8 3.8 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 00-2.13 1.39A5.9 5.9 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.39 2.13a5.9 5.9 0 002.13 1.39c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 002.13-1.39 5.9 5.9 0 001.39-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 00-1.39-2.13A5.9 5.9 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32A6.16 6.16 0 0012 5.84zm0 10.16a4 4 0 110-8 4 4 0 010 8zm7.85-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z' ),
		'rh_social_x'         => array( 'X', 'M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23zm-1.16 17.52h1.83L7.01 4.13H5.04l12.04 15.64z' ),
		'rh_social_youtube'   => array( 'YouTube', 'M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z' ),
	);

	$out = array();
	foreach ( $map as $key => $data ) {
		$url = rh_opt( $key );
		if ( $url ) {
			$out[] = array( 'url' => $url, 'label' => $data[0], 'path' => $data[1] );
		}
	}
	return $out;
}
