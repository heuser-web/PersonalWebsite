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
				// The uploaded logo has dark lettering and the footer is always dark,
				// so it uses the light-lettered twin, same as the header.
				if ( has_custom_logo() ) {
					$rh_logo_light = get_theme_mod( 'rh_logo_dark' ) ? get_theme_mod( 'rh_logo_dark' ) : rh_img( 'logo-hero-light.png' );
					printf(
						'<img class="rh-footer__logo" src="%1$s" alt="%2$s" width="2400" height="600" loading="lazy">',
						esc_url( $rh_logo_light ),
						esc_attr( get_bloginfo( 'name' ) )
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
						<li><?php esc_html_e( 'Reno, Nevada', 'roman-heuser' ); ?></li>
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
