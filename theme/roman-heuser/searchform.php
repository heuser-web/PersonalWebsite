<?php
/**
 * Search form.
 *
 * @package roman-heuser
 */
$rh_sid = 'rh-search-' . wp_rand();
?>
<form role="search" method="get" class="rh-searchform" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="screen-reader-text" for="<?php echo esc_attr( $rh_sid ); ?>"><?php esc_html_e( 'Search', 'roman-heuser' ); ?></label>
	<input type="search" id="<?php echo esc_attr( $rh_sid ); ?>" name="s"
		value="<?php echo esc_attr( get_search_query() ); ?>"
		placeholder="<?php esc_attr_e( 'Search this site', 'roman-heuser' ); ?>">
	<button type="submit"><?php esc_html_e( 'Search', 'roman-heuser' ); ?></button>
</form>
