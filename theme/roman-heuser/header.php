<?php
/**
 * Site header.
 *
 * @package roman-heuser
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#rh-main"><?php esc_html_e( 'Skip to content', 'roman-heuser' ); ?></a>

<header class="rh-header" id="rh-header">
	<div class="rh-edge rh-header__inner">

		<a class="rh-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
			<?php
			if ( has_custom_logo() ) {
				the_custom_logo();
			} else {
				?>
				<span>
					<span class="rh-brand__text"><?php bloginfo( 'name' ); ?></span>
					<?php if ( get_bloginfo( 'description' ) ) : ?>
						<span class="rh-brand__sub"><?php bloginfo( 'description' ); ?></span>
					<?php endif; ?>
				</span>
				<?php
			}
			?>
		</a>

		<button class="rh-burger" id="rh-burger" aria-expanded="false" aria-controls="rh-nav"
			aria-label="<?php esc_attr_e( 'Toggle menu', 'roman-heuser' ); ?>">
			<span></span>
		</button>

		<nav class="rh-nav" id="rh-nav" aria-label="<?php esc_attr_e( 'Primary', 'roman-heuser' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_id'        => 'rh-primary-menu',
					'depth'          => 2,
					'fallback_cb'    => 'rh_menu_fallback',
				)
			);
			?>
		</nav>

	</div>
</header>
<div class="rh-scrim" id="rh-scrim" hidden></div>

<main id="rh-main">
