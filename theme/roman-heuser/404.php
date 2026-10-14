<?php
/**
 * 404 template.
 *
 * @package roman-heuser
 */

get_header();
?>
<section class="rh-edge rh-404">
	<div class="rh-404__code">404</div>
	<h1><?php esc_html_e( 'That page moved on.', 'roman-heuser' ); ?></h1>
	<p class="rh-lede" style="margin-inline:auto">
		<?php esc_html_e( 'The link is broken or the page was renamed. Everything worth reading is one tap away.', 'roman-heuser' ); ?>
	</p>
	<p style="margin-top:2rem">
		<a class="rh-btn rh-btn--primary" href="<?php echo esc_url( home_url( '/' ) ); ?>">
			<?php esc_html_e( 'Back to home', 'roman-heuser' ); ?>
			<span class="rh-btn__arrow" aria-hidden="true">&rarr;</span>
		</a>
	</p>
</section>
<?php
get_footer();
