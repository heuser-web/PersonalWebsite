<?php
/**
 * Home page template.
 *
 * Renders the opening sequence, then The Drive: a scroll-driven night drive
 * from Las Vegas to Reno that ends at links to every other page. If a static page is assigned
 * as the front page and it has body content, that content is printed too.
 *
 * @package roman-heuser
 */

get_header();

$rh_logo_id  = get_theme_mod( 'custom_logo' );

?>

<?php
/*
 * The opening crawl. Rendered on the front page only, hidden until JS decides
 * it should run — it never mounts under prefers-reduced-motion, and only once
 * per browser tab. cinematic.js owns the whole lifecycle.
 */
$rh_intro_logo = $rh_logo_id ? wp_get_attachment_image_url( $rh_logo_id, 'full' ) : rh_img( 'logo-hero-light.png' );
if ( get_theme_mod( 'rh_intro_on', true ) ) :
?>
<div class="rh-intro" id="rh-intro" hidden role="dialog" aria-modal="true" aria-label="<?php esc_attr_e( 'Site introduction', 'roman-heuser' ); ?>">
	<canvas class="rh-intro__warp" aria-hidden="true"></canvas>
	<div class="rh-intro__vignette" aria-hidden="true"></div>
	<div class="rh-intro__scan" aria-hidden="true"></div>
	<div class="rh-intro__grain" aria-hidden="true"></div>
	<div class="rh-intro__flare" aria-hidden="true"></div>
	<div class="rh-intro__flash" aria-hidden="true"></div>

	<div class="rh-intro__stage" aria-hidden="true">

		<p class="rh-beat rh-beat--boot" data-beat="boot"><span class="rh-boot__line"></span><i class="rh-caret"></i></p>

		<?php $rh_name = rh_opt( 'rh_intro_name' ); ?>
		<h2 class="rh-beat rh-beat--name" data-beat="name" data-text="<?php echo esc_attr( $rh_name ); ?>"><?php echo esc_html( $rh_name ); ?></h2>

		<?php
		rh_intro_card( 'rh_intro_c1', 'c1' );
		rh_intro_card( 'rh_intro_c2', 'c2' );
		rh_intro_card( 'rh_intro_c3', 'c3' );
		?>

		<div class="rh-beat rh-beat--sign" data-beat="sign">
			<img src="<?php echo esc_url( $rh_intro_logo ); ?>" alt="">
			<p class="rh-sign__tag"><?php echo wp_kses_post( rh_opt( 'rh_intro_tag' ) ); ?></p>
		</div>

	</div>

	<div class="rh-intro__prog" aria-hidden="true"><i></i></div>
	<button class="rh-intro__skip" type="button"><?php esc_html_e( 'Skip', 'roman-heuser' ); ?></button>
</div>
<template id="rh-intro-template"></template>
<?php endif; // rh_intro_on ?>

<?php
/*
 * THE DRIVE. One HTML file (parts/drive.html) is the single source for this
 * markup; the offline preview reads the same file. All copy is real text, so
 * the page reads correctly with scripts off. Objects: assets/js/drive-world.js.
 * Scroll, camera and input: assets/js/drive.js.
 */
// Light lettering on purpose: the stage is always dark.
echo rh_drive_markup( get_theme_mod( 'rh_logo_dark' ) ? get_theme_mod( 'rh_logo_dark' ) : rh_img( 'logo-hero-light.png' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every token is escaped inside.
?>


<!-- ================= OPTIONAL PAGE BODY (if one is set) ================= -->
<?php
if ( have_posts() ) :
	while ( have_posts() ) :
		the_post();
		$rh_body = trim( get_the_content() );
		if ( $rh_body ) :
			?>
			<section class="rh-section rh-section--alt">
				<div class="rh-edge rh-article"><?php the_content(); ?></div>
			</section>
			<?php
		endif;
	endwhile;
endif;
?>


<!-- ============================ LATEST POST ============================ -->
<?php
$rh_latest = new WP_Query(
	array(
		'posts_per_page'      => 1,
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	)
);
if ( $rh_latest->have_posts() ) :
	while ( $rh_latest->have_posts() ) :
		$rh_latest->the_post();
		?>
		<section class="rh-section">
			<div class="rh-edge">
				<p class="rh-eyebrow rh-reveal"><?php esc_html_e( 'From the blog', 'roman-heuser' ); ?></p>
				<div class="rh-split rh-reveal">
					<?php if ( has_post_thumbnail() ) : ?>
						<div class="rh-split__media"><?php the_post_thumbnail( 'rh-card' ); ?></div>
					<?php endif; ?>
					<div>
						<h3 style="font-size:clamp(1.6rem,1.2rem + 1.6vw,2.4rem)"><?php the_title(); ?></h3>
						<p class="rh-lede"><?php echo esc_html( get_the_excerpt() ); ?></p>
						<a class="rh-btn rh-btn--primary" href="<?php the_permalink(); ?>" style="margin-top:.75rem">
							<?php esc_html_e( 'Read the post', 'roman-heuser' ); ?>
							<span class="rh-btn__arrow" aria-hidden="true">&rarr;</span>
						</a>
					</div>
				</div>
			</div>
		</section>
		<?php
	endwhile;
	wp_reset_postdata();
endif;

get_footer();
