<?php
/**
 * Site footer.
 *
 * @package roman-heuser
 */

$rh_social = rh_social_links();
$rh_email  = rh_opt( 'rh_contact_email' );
?>
</main><!-- #rh-main -->

<footer class="rh-footer">
	<div class="rh-edge">
		<div class="rh-footer__grid">

			<div>
				<?php
				$rh_logo_id = get_theme_mod( 'custom_logo' );
				if ( $rh_logo_id ) {
					echo wp_get_attachment_image(
						$rh_logo_id,
						'full',
						false,
						array(
							'class'   => 'rh-footer__logo',
							'alt'     => esc_attr( get_bloginfo( 'name' ) ),
							'loading' => 'lazy',
						)
					);
				} else {
					printf( '<h2 style="font-family:var(--rh-font-display);font-size:1.6rem;letter-spacing:.05em;color:var(--rh-text-invert);text-transform:none">%s</h2>', esc_html( get_bloginfo( 'name' ) ) );
				}
				?>

				<p><?php echo wp_kses_post( rh_opt( 'rh_footer_blurb' ) ); ?></p>

				<?php if ( $rh_social ) : ?>
					<ul class="rh-social">
						<?php foreach ( $rh_social as $rh_s ) : ?>
							<li>
								<a href="<?php echo esc_url( $rh_s['url'] ); ?>" target="_blank" rel="noopener noreferrer"
									aria-label="<?php echo esc_attr( $rh_s['label'] ); ?>">
									<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
										<path d="<?php echo esc_attr( $rh_s['path'] ); ?>"/>
									</svg>
								</a>
							</li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			</div>

			<div>
				<?php if ( is_active_sidebar( 'footer-2' ) ) : ?>
					<?php dynamic_sidebar( 'footer-2' ); ?>
				<?php else : ?>
					<h2 class="widget-title"><?php esc_html_e( 'Explore', 'roman-heuser' ); ?></h2>
					<?php
					wp_nav_menu(
						array(
							'theme_location' => 'primary',
							'container'      => false,
							'depth'          => 1,
							'fallback_cb'    => 'rh_menu_fallback',
						)
					);
					?>
				<?php endif; ?>
			</div>

			<div>
				<?php if ( is_active_sidebar( 'footer-3' ) ) : ?>
					<?php dynamic_sidebar( 'footer-3' ); ?>
				<?php else : ?>
					<h2 class="widget-title"><?php esc_html_e( 'Get in touch', 'roman-heuser' ); ?></h2>
					<ul>
						<?php if ( $rh_email ) : ?>
							<li><a href="mailto:<?php echo esc_attr( antispambot( $rh_email ) ); ?>"><?php echo esc_html( antispambot( $rh_email ) ); ?></a></li>
						<?php endif; ?>
						<li><?php esc_html_e( 'Las Vegas, Nevada', 'roman-heuser' ); ?></li>
						<li><?php esc_html_e( 'University of Nevada, Reno', 'roman-heuser' ); ?></li>
					</ul>
				<?php endif; ?>
			</div>

		</div>

		<div class="rh-footer__bar">
			<span>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. <?php esc_html_e( 'All rights reserved.', 'roman-heuser' ); ?></span>
			<span><?php esc_html_e( 'Self-hosted WordPress · Custom "Heuser" theme, hand-built', 'roman-heuser' ); ?></span>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
