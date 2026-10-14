<?php
/**
 * Blog index / archive fallback.
 *
 * @package roman-heuser
 */

get_header();
?>

<header class="rh-pagehead rh-pagehead--art" style="--rh-pagehead-art:url('<?php echo esc_url( rh_img( 'mesh.jpg' ) ); ?>')">
	<div class="rh-edge" style="position:relative;z-index:1">
		<p class="rh-eyebrow">
			<?php
			if ( is_search() ) {
				esc_html_e( 'Search', 'roman-heuser' );
			} elseif ( is_archive() ) {
				esc_html_e( 'Archive', 'roman-heuser' );
			} else {
				esc_html_e( 'Writing', 'roman-heuser' );
			}
			?>
		</p>
		<h1>
			<?php
			if ( is_home() && ! is_front_page() ) {
				single_post_title();
			} elseif ( is_search() ) {
				/* translators: %s: search query */
				printf( esc_html__( 'Results for &ldquo;%s&rdquo;', 'roman-heuser' ), esc_html( get_search_query() ) );
			} elseif ( is_archive() ) {
				the_archive_title();
			} else {
				esc_html_e( 'Blog', 'roman-heuser' );
			}
			?>
		</h1>
	</div>
</header>

<section class="rh-section">
	<div class="rh-edge">
		<?php if ( have_posts() ) : ?>

			<div class="rh-postlist">
				<?php
				while ( have_posts() ) :
					the_post();
					?>
					<article <?php post_class( 'rh-card rh-card--hover rh-postcard rh-reveal' ); ?> style="padding:0;overflow:hidden">
						<?php if ( has_post_thumbnail() ) : ?>
							<a class="rh-postcard__thumb" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
								<?php the_post_thumbnail( 'rh-card' ); ?>
							</a>
						<?php endif; ?>
						<div style="padding:clamp(1.4rem,3vw,2rem);display:flex;flex-direction:column;flex:1">
							<p class="rh-card__kicker"><?php echo esc_html( get_the_date() ); ?></p>
							<h3><a href="<?php the_permalink(); ?>" style="text-decoration:none"><?php the_title(); ?></a></h3>
							<p><?php echo esc_html( get_the_excerpt() ); ?></p>
							<span class="rh-card__foot">
								<?php esc_html_e( 'Read on', 'roman-heuser' ); ?>
								<span class="rh-btn__arrow" aria-hidden="true">&rarr;</span>
							</span>
						</div>
					</article>
					<?php
				endwhile;
				?>
			</div>

			<?php
			the_posts_pagination(
				array(
					'class'     => 'rh-pagination',
					'mid_size'  => 2,
					'prev_text' => esc_html__( 'Previous', 'roman-heuser' ),
					'next_text' => esc_html__( 'Next', 'roman-heuser' ),
				)
			);
			?>

		<?php else : ?>
			<div class="rh-article">
				<h2><?php esc_html_e( 'Nothing here yet', 'roman-heuser' ); ?></h2>
				<p class="rh-lede"><?php esc_html_e( 'No posts matched. Try the menu above.', 'roman-heuser' ); ?></p>
			</div>
		<?php endif; ?>
	</div>
</section>

<?php
get_footer();
