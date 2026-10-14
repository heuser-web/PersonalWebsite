<?php
/**
 * Single page template (About Me, Resume, Gallery, and any page you add).
 *
 * @package roman-heuser
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>

	<header class="rh-pagehead rh-pagehead--art" style="--rh-pagehead-art:url('<?php echo esc_url( rh_img( 'mesh.jpg' ) ); ?>')">
		<div class="rh-edge" style="position:relative;z-index:1">
			<p class="rh-eyebrow"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></p>
			<h1><?php the_title(); ?></h1>
			<?php if ( has_excerpt() ) : ?>
				<p><?php echo esc_html( get_the_excerpt() ); ?></p>
			<?php endif; ?>
		</div>
	</header>

	<?php if ( has_post_thumbnail() ) : ?>
		<div class="rh-edge" style="margin-top:calc(var(--rh-section) * -0.35);position:relative;z-index:2">
			<div class="rh-featured rh-reveal"><?php the_post_thumbnail( 'rh-hero' ); ?></div>
		</div>
	<?php endif; ?>

	<article class="rh-section" id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
		<div class="rh-edge">
			<div class="rh-article">
				<?php
				the_content();

				wp_link_pages(
					array(
						'before' => '<div class="rh-pagination">',
						'after'  => '</div>',
					)
				);
				?>
			</div>

			<?php
			// Pages normally have comments closed; the template supports them anyway.
			if ( comments_open() || get_comments_number() ) {
				echo '<div class="rh-article">';
				comments_template();
				echo '</div>';
			}
			?>
		</div>
	</article>

	<?php
endwhile;

get_footer();
