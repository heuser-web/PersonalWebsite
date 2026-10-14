<?php
/**
 * Single blog post — the template that carries the graded blog post,
 * its four comments and the four replies.
 *
 * @package roman-heuser
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>

	<header class="rh-pagehead rh-pagehead--art" style="--rh-pagehead-art:url('<?php echo esc_url( rh_img( 'mesh.jpg' ) ); ?>')">
		<div class="rh-edge" style="position:relative;z-index:1">
			<p class="rh-eyebrow"><?php esc_html_e( 'Blog', 'roman-heuser' ); ?></p>
			<h1><?php the_title(); ?></h1>
			<p>
				<?php
				printf(
					/* translators: 1: post date, 2: reading estimate */
					esc_html__( 'Published %1$s · about %2$s to read', 'roman-heuser' ),
					esc_html( get_the_date() ),
					esc_html( rh_reading_time( get_the_content() ) )
				);
				?>
			</p>
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
				<?php if ( has_category() ) : ?>
					<div class="rh-meta"><?php the_category( ' · ' ); ?></div>
				<?php endif; ?>

				<?php
				the_content();

				wp_link_pages(
					array(
						'before' => '<div class="rh-pagination">',
						'after'  => '</div>',
					)
				);
				?>

				<?php
				$rh_tags = get_the_tag_list( '', ' ' );
				if ( $rh_tags ) :
					?>
					<div class="rh-meta" style="margin-top:2.5rem"><?php echo wp_kses_post( $rh_tags ); ?></div>
				<?php endif; ?>

				<?php
				// Prev / next, so a blog with more than one post actually reads
				// like a blog rather than a pile of orphan pages.
				$rh_prev = get_previous_post();
				$rh_next = get_next_post();
				if ( $rh_prev || $rh_next ) :
					?>
					<nav class="rh-postnav" aria-label="<?php esc_attr_e( 'More posts', 'roman-heuser' ); ?>">
						<?php if ( $rh_prev ) : ?>
							<a class="rh-postnav__item rh-postnav__item--prev" href="<?php echo esc_url( get_permalink( $rh_prev ) ); ?>">
								<span class="rh-postnav__dir"><?php esc_html_e( 'Previous', 'roman-heuser' ); ?></span>
								<span class="rh-postnav__title"><?php echo esc_html( get_the_title( $rh_prev ) ); ?></span>
							</a>
						<?php endif; ?>
						<?php if ( $rh_next ) : ?>
							<a class="rh-postnav__item rh-postnav__item--next" href="<?php echo esc_url( get_permalink( $rh_next ) ); ?>">
								<span class="rh-postnav__dir"><?php esc_html_e( 'Next', 'roman-heuser' ); ?></span>
								<span class="rh-postnav__title"><?php echo esc_html( get_the_title( $rh_next ) ); ?></span>
							</a>
						<?php endif; ?>
					</nav>
				<?php endif; ?>

				<?php comments_template(); ?>
			</div>
		</div>
	</article>

	<?php
endwhile;

get_footer();
