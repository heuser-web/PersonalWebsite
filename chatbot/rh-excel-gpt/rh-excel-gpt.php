<?php
/**
 * Plugin Name:       Excel GPT Assistant
 * Plugin URI:        https://romanheuser.com
 * Description:       An Excel chatbot that answers questions, checks formulas and writes them. Works with no setup. Add an API key and it answers with a live model instead; the key stays on the server and is never sent to the browser. Shortcodes: [rh_excel_helper] for a panel in the page, [rh_excel_gpt] for a floating button.
 * Version:           1.1.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Roman Heuser
 * License:           GPL-2.0-or-later
 * Text Domain:       rh-excel-gpt
 *
 * @package rh-excel-gpt
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'RHXG_VER', '1.1.0' );
define( 'RHXG_OPT', 'rhxg_settings' );

/* =========================================================================
 * 1. SETTINGS
 * ====================================================================== */

/**
 * The shipped system prompt. Kept in a text file so the local dev server can
 * test exactly what WordPress sends.
 *
 * @return string
 */
function rhxg_default_prompt() {
	$file = plugin_dir_path( __FILE__ ) . 'system-prompt.txt';
	$text = is_readable( $file ) ? file_get_contents( $file ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions
	return $text ? trim( $text ) : 'You are a Microsoft Excel tutor. Only answer Excel questions.';
}

/**
 * Stored settings, with defaults.
 *
 * @return array
 */
function rhxg_opts() {
	$defaults = array(
		'enabled'   => 0,
		'provider'  => 'openai',
		'api_key'   => '',
		'model'     => 'gpt-6-luna',
		'gpt_url'   => '',
		'gpt_until' => '2026-12-11',
		'limit'     => 20,
		'daily'     => 300,
		'greeting'  => "Hi, I am **Excel Helper**. Ask a question, paste a formula to check, or describe what you need and I will write it.",
		'system'    => rhxg_default_prompt(),
	);
	$saved = get_option( RHXG_OPT, array() );
	return wp_parse_args( is_array( $saved ) ? $saved : array(), $defaults );
}

add_action( 'admin_menu', function () {
	add_options_page(
		__( 'Excel GPT Assistant', 'rh-excel-gpt' ),
		__( 'Excel GPT', 'rh-excel-gpt' ),
		'manage_options',
		'rh-excel-gpt',
		'rhxg_settings_page'
	);
} );

add_action( 'admin_init', function () {
	register_setting( 'rhxg_group', RHXG_OPT, 'rhxg_sanitize' );
} );

/**
 * Sanitize the settings form. The key is only overwritten when a new one is
 * actually typed, so the masked field cannot blank it out by accident.
 *
 * @param array $in Raw input.
 * @return array
 */
function rhxg_sanitize( $in ) {
	$old = rhxg_opts();
	$out = array(
		'enabled'  => empty( $in['enabled'] ) ? 0 : 1,
		'provider' => in_array( ( $in['provider'] ?? '' ), array( 'openai', 'anthropic' ), true ) ? $in['provider'] : 'openai',
		'model'    => sanitize_text_field( $in['model'] ?? '' ),
		'gpt_url'  => esc_url_raw( $in['gpt_url'] ?? '' ),
		'gpt_until' => preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) ( $in['gpt_until'] ?? '' ) ) ? $in['gpt_until'] : '2026-12-11',
		'limit'    => max( 1, min( 200, (int) ( $in['limit'] ?? 20 ) ) ),
		'daily'    => max( 10, min( 5000, (int) ( $in['daily'] ?? 300 ) ) ),
		'greeting' => sanitize_textarea_field( $in['greeting'] ?? '' ),
		'system'   => sanitize_textarea_field( $in['system'] ?? '' ),
		'api_key'  => $old['api_key'],
	);
	// A model from the other provider can never work, so switch to a sensible one.
	if ( 'anthropic' === $out['provider'] && 0 !== strpos( $out['model'], 'claude' ) ) {
		$out['model'] = 'claude-haiku-5-5';
	} elseif ( 'openai' === $out['provider'] && ( '' === $out['model'] || 0 === strpos( $out['model'], 'claude' ) ) ) {
		$out['model'] = 'gpt-6-luna';
	}
	// Clearing the box restores the shipped prompt instead of sending none.
	if ( '' === trim( $out['system'] ) ) {
		$out['system'] = rhxg_default_prompt();
	}
	$typed = trim( (string) ( $in['api_key'] ?? '' ) );
	if ( '' !== $typed && 0 !== strpos( $typed, '•' ) ) {
		$out['api_key'] = $typed;
	}
	return $out;
}

/** Render the settings screen. */
function rhxg_settings_page() {
	$o      = rhxg_opts();
	$masked = $o['api_key'] ? str_repeat( '•', 28 ) . substr( $o['api_key'], -4 ) : '';
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Excel GPT Assistant', 'rh-excel-gpt' ); ?></h1>
		<p style="max-width:70ch">
			<?php esc_html_e( 'Put [rh_excel_helper] on a page for an Excel panel, or [rh_excel_gpt] for a floating button. Both work with no setup. Your API key, if you add one, is stored on this server and every request is proxied through your own site, so the key is never sent to a visitor\'s browser.', 'rh-excel-gpt' ); ?>
		</p>

		<form method="post" action="options.php">
			<?php settings_fields( 'rhxg_group' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><?php esc_html_e( 'Enable', 'rh-excel-gpt' ); ?></th>
					<td><label>
						<input type="checkbox" name="<?php echo esc_attr( RHXG_OPT ); ?>[enabled]" value="1" <?php checked( $o['enabled'], 1 ); ?>>
						<?php esc_html_e( 'Answer questions with the live model', 'rh-excel-gpt' ); ?>
					</label>
					<p class="description"><?php esc_html_e( 'Leave this off and the assistant still answers, checks and writes formulas from its built-in knowledge. It also falls back to that whenever the live model is busy or unreachable.', 'rh-excel-gpt' ); ?></p></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Provider', 'rh-excel-gpt' ); ?></th>
					<td><select name="<?php echo esc_attr( RHXG_OPT ); ?>[provider]">
						<option value="openai" <?php selected( $o['provider'], 'openai' ); ?>>OpenAI</option>
						<option value="anthropic" <?php selected( $o['provider'], 'anthropic' ); ?>>Anthropic</option>
					</select></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'API key', 'rh-excel-gpt' ); ?></th>
					<td><input type="password" class="regular-text" autocomplete="off"
						name="<?php echo esc_attr( RHXG_OPT ); ?>[api_key]"
						placeholder="<?php echo esc_attr( $masked ? $masked : 'sk-…' ); ?>">
						<p class="description"><?php esc_html_e( 'Stored in your database, never printed to the page. Leave blank to keep the current key.', 'rh-excel-gpt' ); ?></p></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Model', 'rh-excel-gpt' ); ?></th>
					<td><input type="text" class="regular-text" name="<?php echo esc_attr( RHXG_OPT ); ?>[model]" value="<?php echo esc_attr( $o['model'] ); ?>">
						<p class="description"><?php esc_html_e( 'Use a model your account can call: gpt-6-luna for OpenAI, or claude-haiku-5-5 for Anthropic. OpenAI shuts down gpt-4o-mini on 14 January 2027.', 'rh-excel-gpt' ); ?></p></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Your Lab #3 Custom GPT', 'rh-excel-gpt' ); ?></th>
					<td><input type="url" class="regular-text" name="<?php echo esc_attr( RHXG_OPT ); ?>[gpt_url]" value="<?php echo esc_attr( $o['gpt_url'] ); ?>" placeholder="https://chatgpt.com/g/g-…">
						<p class="description"><?php esc_html_e( 'Linked from the assistant footer.', 'rh-excel-gpt' ); ?></p></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Hide that link on', 'rh-excel-gpt' ); ?></th>
					<td><input type="date" name="<?php echo esc_attr( RHXG_OPT ); ?>[gpt_until]" value="<?php echo esc_attr( $o['gpt_until'] ); ?>">
						<p class="description"><?php esc_html_e( 'OpenAI takes custom GPT pages offline on 11 December 2026. The link hides itself that day so visitors never reach a dead page.', 'rh-excel-gpt' ); ?></p></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Rate limit', 'rh-excel-gpt' ); ?></th>
					<td><input type="number" min="1" max="200" name="<?php echo esc_attr( RHXG_OPT ); ?>[limit]" value="<?php echo esc_attr( $o['limit'] ); ?>">
						<?php esc_html_e( 'messages per visitor per hour', 'rh-excel-gpt' ); ?>
						<p class="description"><?php esc_html_e( 'Protects your API bill if the page gets traffic.', 'rh-excel-gpt' ); ?></p></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Daily cap', 'rh-excel-gpt' ); ?></th>
					<td><input type="number" min="10" max="5000" name="<?php echo esc_attr( RHXG_OPT ); ?>[daily]" value="<?php echo esc_attr( $o['daily'] ); ?>">
						<?php esc_html_e( 'messages site-wide per day', 'rh-excel-gpt' ); ?>
						<p class="description"><?php esc_html_e( 'A hard ceiling across all visitors. The per-visitor limit does not stop many different IPs, this does.', 'rh-excel-gpt' ); ?></p></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Greeting', 'rh-excel-gpt' ); ?></th>
					<td><textarea name="<?php echo esc_attr( RHXG_OPT ); ?>[greeting]" rows="2" class="large-text"><?php echo esc_textarea( $o['greeting'] ); ?></textarea></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'System prompt', 'rh-excel-gpt' ); ?></th>
					<td><textarea name="<?php echo esc_attr( RHXG_OPT ); ?>[system]" rows="18" class="large-text code"><?php echo esc_textarea( $o['system'] ); ?></textarea>
						<p class="description"><?php esc_html_e( 'This is the prompt engineering part. Paste your Lab #3 prompt at the top and keep the rules under it. Keep the rule that limits it to Excel, or it will answer anything. Clear the box and save to restore the shipped prompt.', 'rh-excel-gpt' ); ?></p></td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

/* =========================================================================
 * 2. REST PROXY
 * ====================================================================== */

add_action( 'rest_api_init', function () {
	register_rest_route(
		'rh-excel-gpt/v1',
		'/chat',
		array(
			'methods'             => 'POST',
			'callback'            => 'rhxg_chat',
			'permission_callback' => '__return_true', // Public on purpose: logged-out visitors use it. Guarded by the two rate limits below.
			'args'                => array(
				'message' => array( 'required' => true, 'type' => 'string' ),
				'history' => array( 'required' => false, 'type' => 'array' ),
			),
		)
	);
} );

/** Shorten text without needing the mbstring extension. */
function rhxg_cut( $text, $max ) {
	return function_exists( 'mb_substr' ) ? mb_substr( $text, 0, $max ) : substr( $text, 0, $max );
}

/** Coarse per-IP identifier for rate limiting. */
function rhxg_visitor_key() {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
	return 'rhxg_' . md5( $ip );
}

/**
 * Handle one chat turn.
 *
 * @param WP_REST_Request $req Request.
 * @return WP_REST_Response
 */
function rhxg_chat( $req ) {
	$o = rhxg_opts();

	if ( empty( $o['enabled'] ) || empty( $o['api_key'] ) ) {
		return new WP_REST_Response(
			array( 'error' => 'not_configured', 'gpt_url' => $o['gpt_url'] ),
			200
		);
	}

	$message = trim( wp_check_invalid_utf8( (string) $req->get_param( 'message' ) ) );
	if ( '' === $message ) {
		return new WP_REST_Response( array( 'error' => 'empty' ), 200 );
	}
	$message = rhxg_cut( $message, 1200 );

	// Two limits. The per-visitor one stops a single person hammering it; the
	// site-wide one is what actually protects the API bill, because a per-IP
	// limit does nothing against traffic from many different addresses.
	$key   = rhxg_visitor_key();
	$count = (int) get_transient( $key );
	if ( $count >= (int) $o['limit'] ) {
		return new WP_REST_Response( array( 'error' => 'rate_limited' ), 200 );
	}

	$day_key = 'rhxg_day_' . gmdate( 'Ymd' );
	$today   = (int) get_transient( $day_key );
	if ( $today >= (int) $o['daily'] ) {
		return new WP_REST_Response( array( 'error' => 'rate_limited' ), 200 );
	}

	set_transient( $key, $count + 1, HOUR_IN_SECONDS );
	set_transient( $day_key, $today + 1, DAY_IN_SECONDS );

	// Rebuild a short history so follow-up questions work, capped for cost.
	$turns = array();
	foreach ( array_slice( (array) $req->get_param( 'history' ), -6 ) as $h ) {
		if ( ! is_array( $h ) ) {
			continue;
		}
		$role = ( isset( $h['role'] ) && 'assistant' === $h['role'] ) ? 'assistant' : 'user';
		$text = isset( $h['text'] ) && is_string( $h['text'] ) ? rhxg_cut( trim( wp_check_invalid_utf8( $h['text'] ) ), 1500 ) : '';
		if ( '' === $text || ( ! $turns && 'assistant' === $role ) ) {
			continue; // A conversation has to open with the visitor.
		}
		$turns[] = array( 'role' => $role, 'content' => $text );
	}
	$turns[] = array( 'role' => 'user', 'content' => $message );

	$reply = ( 'anthropic' === $o['provider'] )
		? rhxg_call_anthropic( $o, $turns )
		: rhxg_call_openai( $o, $turns );

	if ( is_wp_error( $reply ) ) {
		// Provider errors can name the account or part of the key. Admins only.
		$out = array( 'error' => 'upstream' );
		if ( current_user_can( 'manage_options' ) ) {
			$out['detail'] = $reply->get_error_message();
		}
		return new WP_REST_Response( $out, 200 );
	}

	return new WP_REST_Response( array( 'reply' => $reply ), 200 );
}

/**
 * POST JSON and return the decoded body, or a WP_Error with a readable reason.
 *
 * @param string $url     Endpoint.
 * @param array  $headers Headers.
 * @param array  $body    Request body.
 * @return array|WP_Error
 */
function rhxg_post( $url, $headers, $body ) {
	$res = wp_remote_post(
		$url,
		array(
			'timeout' => 40,
			'headers' => $headers + array( 'Content-Type' => 'application/json' ),
			'body'    => wp_json_encode( $body ),
		)
	);
	if ( is_wp_error( $res ) ) {
		return $res;
	}
	$data = json_decode( wp_remote_retrieve_body( $res ), true );
	$code = (int) wp_remote_retrieve_response_code( $res );
	if ( isset( $data['error']['message'] ) ) {
		return new WP_Error( 'api', $data['error']['message'], array( 'param' => $data['error']['param'] ?? '' ) );
	}
	if ( $code < 200 || $code > 299 || ! is_array( $data ) ) {
		return new WP_Error( 'api', 'The model provider answered with HTTP ' . $code . '.' );
	}
	return $data;
}

/**
 * OpenAI chat completion.
 *
 * @param array $o     Settings.
 * @param array $turns Conversation.
 * @return string|WP_Error
 */
function rhxg_call_openai( $o, $turns ) {
	$thinks = (bool) preg_match( '/^(gpt-[5-9]|o\d)/', $o['model'] );
	$body   = array(
		'model'                 => $o['model'],
		'messages'              => array_merge( array( array( 'role' => 'system', 'content' => $o['system'] ) ), $turns ),
		// On reasoning models this limit also has to cover the hidden thinking.
		'max_completion_tokens' => $thinks ? 3000 : 900,
	);
	if ( $thinks ) {
		$body['reasoning_effort'] = 'low';
	} else {
		$body['temperature'] = 0.3;
	}
	$headers = array( 'Authorization' => 'Bearer ' . $o['api_key'] );
	$data    = rhxg_post( 'https://api.openai.com/v1/chat/completions', $headers, $body );

	// If this model refuses one of the optional settings, drop it and try once more.
	if ( is_wp_error( $data ) ) {
		$info  = $data->get_error_data();
		$param = is_array( $info ) && is_string( $info['param'] ?? '' ) ? ( $info['param'] ?? '' ) : '';
		if ( in_array( $param, array( 'reasoning_effort', 'temperature' ), true ) && isset( $body[ $param ] ) ) {
			unset( $body[ $param ] );
			$data = rhxg_post( 'https://api.openai.com/v1/chat/completions', $headers, $body );
		}
		if ( is_wp_error( $data ) ) {
			return $data;
		}
	}
	$text = trim( (string) ( $data['choices'][0]['message']['content'] ?? '' ) );
	return '' !== $text ? $text : new WP_Error( 'api', 'Empty response from the model.' );
}

/**
 * Anthropic messages call.
 *
 * @param array $o     Settings.
 * @param array $turns Conversation.
 * @return string|WP_Error
 */
function rhxg_call_anthropic( $o, $turns ) {
	$data = rhxg_post(
		'https://api.anthropic.com/v1/messages',
		array(
			'x-api-key'         => $o['api_key'],
			'anthropic-version' => '2023-06-01',
		),
		array(
			'model'      => $o['model'],
			'system'     => $o['system'],
			'messages'   => $turns,
			'max_tokens' => 3000,
		)
	);
	if ( is_wp_error( $data ) ) {
		return $data;
	}
	// The reply can open with thinking blocks, so collect the text ones.
	$text = '';
	foreach ( (array) ( $data['content'] ?? array() ) as $block ) {
		if ( is_array( $block ) && 'text' === ( $block['type'] ?? '' ) ) {
			$text .= $block['text'] ?? '';
		}
	}
	$text = trim( $text );
	return '' !== $text ? $text : new WP_Error( 'api', 'Empty response from the model.' );
}

/* =========================================================================
 * 3. FRONT END
 * ====================================================================== */

/** Load the engine and hand it the public settings. Safe to call twice. */
function rhxg_enqueue_brain() {
	if ( wp_script_is( 'rhxg-brain', 'enqueued' ) ) {
		return;
	}
	$o = rhxg_opts();
	wp_enqueue_script( 'rhxg-brain', plugins_url( 'assets/excel-brain.js', __FILE__ ), array(), RHXG_VER, true );
	wp_localize_script(
		'rhxg-brain',
		'RHXG',
		array(
			'endpoint' => esc_url_raw( rest_url( 'rh-excel-gpt/v1/chat' ) ),
			'nonce'    => wp_create_nonce( 'wp_rest' ),
			'greeting' => $o['greeting'],
			'gptUrl'   => $o['gpt_url'],
			'gptUntil' => $o['gpt_until'],
			'live'     => ( ! empty( $o['enabled'] ) && ! empty( $o['api_key'] ) ) ? 1 : 0,
		)
	);
}

/**
 * Read one of the plugin's own markup files.
 *
 * @param string $name File name in views/.
 * @return string
 */
function rhxg_view( $name ) {
	$file = plugin_dir_path( __FILE__ ) . 'views/' . $name;
	return is_readable( $file ) ? (string) file_get_contents( $file ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions
}

// Panel inside the page.
add_shortcode( 'rh_excel_helper', function () {
	rhxg_enqueue_brain();
	return rhxg_view( 'helper.html' );
} );

// Floating button.
add_shortcode( 'rh_excel_gpt', function () {
	rhxg_enqueue_brain();
	wp_enqueue_style( 'rhxg', plugins_url( 'assets/rhxg.css', __FILE__ ), array(), RHXG_VER );
	wp_enqueue_script( 'rhxg', plugins_url( 'assets/rhxg.js', __FILE__ ), array( 'rhxg-brain' ), RHXG_VER, true );
	return rhxg_view( 'launcher.html' );
} );
