<?php
/**
 * Plugin Name:       Excel GPT Assistant
 * Plugin URI:        https://romanheuser.com
 * Description:       A live GPT chatbot that answers Microsoft Excel questions. The API key is stored server-side and every request is proxied through this site, so the key is never exposed to the browser. Adds a floating launcher via the [rh_excel_gpt] shortcode.
 * Version:           1.0.0
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

define( 'RHXG_VER', '1.0.0' );
define( 'RHXG_OPT', 'rhxg_settings' );

/* =========================================================================
 * 1. SETTINGS
 * ====================================================================== */

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
		'model'     => 'gpt-4o-mini',
		'gpt_url'   => '',
		'limit'     => 20,
		'daily'     => 300,
		'greeting'  => 'Hi — I am an Excel assistant. Ask me about formulas, PivotTables, charts, or the error message you are stuck on.',
		'system'    => "You are an expert Microsoft Excel tutor embedded on a student's personal website.\n\nRules:\n- Answer ONLY questions about Microsoft Excel, spreadsheets, and closely related data work. If asked about anything else, say so politely in one sentence and steer back to Excel.\n- Be concise. Lead with the formula or the click path, then explain briefly.\n- Show formulas on their own line, exactly as they would be typed.\n- When a beginner is likely to hit a common mistake (absolute references, exact-match lookups, sorting a single column), warn them.\n- Never invent an Excel function that does not exist. If unsure whether a function is available in the user's version, say which version it needs.\n- Keep answers under about 200 words unless asked for more.",
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
		'limit'    => max( 1, min( 200, (int) ( $in['limit'] ?? 20 ) ) ),
		'daily'    => max( 10, min( 5000, (int) ( $in['daily'] ?? 300 ) ) ),
		'greeting' => sanitize_textarea_field( $in['greeting'] ?? '' ),
		'system'   => sanitize_textarea_field( $in['system'] ?? '' ),
		'api_key'  => $old['api_key'],
	);
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
			<?php esc_html_e( 'Put the shortcode [rh_excel_gpt] on any page to add a floating Excel assistant. Your API key is stored on this server and every request is proxied through your own site, so the key is never sent to a visitor\'s browser.', 'rh-excel-gpt' ); ?>
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
					<p class="description"><?php esc_html_e( 'Leave this off and the assistant still appears, but points visitors at your Custom GPT instead of calling the API.', 'rh-excel-gpt' ); ?></p></td>
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
						<p class="description"><?php esc_html_e( 'Set this to a model your account can use — e.g. gpt-4o-mini for OpenAI, or claude-sonnet-5 for Anthropic.', 'rh-excel-gpt' ); ?></p></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Your Lab #3 Custom GPT', 'rh-excel-gpt' ); ?></th>
					<td><input type="url" class="regular-text" name="<?php echo esc_attr( RHXG_OPT ); ?>[gpt_url]" value="<?php echo esc_attr( $o['gpt_url'] ); ?>" placeholder="https://chatgpt.com/g/g-…">
						<p class="description"><?php esc_html_e( 'Linked from the assistant footer, and used as the fallback when the live model is off.', 'rh-excel-gpt' ); ?></p></td>
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
					<td><textarea name="<?php echo esc_attr( RHXG_OPT ); ?>[system]" rows="12" class="large-text code"><?php echo esc_textarea( $o['system'] ); ?></textarea>
						<p class="description"><?php esc_html_e( 'This is the prompt engineering part. Keep the rule that limits it to Excel, or it will happily answer anything.', 'rh-excel-gpt' ); ?></p></td>
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
			'permission_callback' => '__return_true', // Public endpoint; guarded by nonce + rate limit below.
			'args'                => array(
				'message' => array( 'required' => true, 'type' => 'string' ),
				'history' => array( 'required' => false, 'type' => 'array' ),
			),
		)
	);
} );

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

	$message = trim( (string) $req->get_param( 'message' ) );
	if ( '' === $message ) {
		return new WP_REST_Response( array( 'error' => 'empty' ), 200 );
	}
	$message = mb_substr( $message, 0, 1200 );

	// Rebuild a short history so follow-up questions work, capped for cost.
	$history = (array) $req->get_param( 'history' );
	$turns   = array();
	foreach ( array_slice( $history, -6 ) as $h ) {
		$role = ( isset( $h['role'] ) && 'assistant' === $h['role'] ) ? 'assistant' : 'user';
		$text = isset( $h['text'] ) ? mb_substr( sanitize_textarea_field( $h['text'] ), 0, 1200 ) : '';
		if ( '' !== $text ) {
			$turns[] = array( 'role' => $role, 'content' => $text );
		}
	}
	$turns[] = array( 'role' => 'user', 'content' => $message );

	$reply = ( 'anthropic' === $o['provider'] )
		? rhxg_call_anthropic( $o, $turns )
		: rhxg_call_openai( $o, $turns );

	if ( is_wp_error( $reply ) ) {
		return new WP_REST_Response(
			array( 'error' => 'upstream', 'detail' => $reply->get_error_message() ),
			200
		);
	}

	return new WP_REST_Response( array( 'reply' => $reply ), 200 );
}

/**
 * OpenAI chat completion.
 *
 * @param array $o     Settings.
 * @param array $turns Conversation.
 * @return string|WP_Error
 */
function rhxg_call_openai( $o, $turns ) {
	$messages = array_merge(
		array( array( 'role' => 'system', 'content' => $o['system'] ) ),
		$turns
	);
	$res = wp_remote_post(
		'https://api.openai.com/v1/chat/completions',
		array(
			'timeout' => 30,
			'headers' => array(
				'Authorization' => 'Bearer ' . $o['api_key'],
				'Content-Type'  => 'application/json',
			),
			'body'    => wp_json_encode(
				array(
					'model'       => $o['model'],
					'messages'    => $messages,
					'max_tokens'  => 600,
					'temperature' => 0.3,
				)
			),
		)
	);
	if ( is_wp_error( $res ) ) {
		return $res;
	}
	$body = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( isset( $body['error']['message'] ) ) {
		return new WP_Error( 'api', $body['error']['message'] );
	}
	$text = $body['choices'][0]['message']['content'] ?? '';
	return $text ? $text : new WP_Error( 'api', 'Empty response from the model.' );
}

/**
 * Anthropic messages call.
 *
 * @param array $o     Settings.
 * @param array $turns Conversation.
 * @return string|WP_Error
 */
function rhxg_call_anthropic( $o, $turns ) {
	$res = wp_remote_post(
		'https://api.anthropic.com/v1/messages',
		array(
			'timeout' => 30,
			'headers' => array(
				'x-api-key'         => $o['api_key'],
				'anthropic-version' => '2023-06-01',
				'Content-Type'      => 'application/json',
			),
			'body'    => wp_json_encode(
				array(
					'model'      => $o['model'],
					'system'     => $o['system'],
					'messages'   => $turns,
					'max_tokens' => 600,
				)
			),
		)
	);
	if ( is_wp_error( $res ) ) {
		return $res;
	}
	$body = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( isset( $body['error']['message'] ) ) {
		return new WP_Error( 'api', $body['error']['message'] );
	}
	$text = $body['content'][0]['text'] ?? '';
	return $text ? $text : new WP_Error( 'api', 'Empty response from the model.' );
}

/* =========================================================================
 * 3. FRONT END
 * ====================================================================== */

add_shortcode( 'rh_excel_gpt', function () {
	$o = rhxg_opts();

	wp_enqueue_style( 'rhxg', plugins_url( 'assets/rhxg.css', __FILE__ ), array(), RHXG_VER );
	wp_enqueue_script( 'rhxg', plugins_url( 'assets/rhxg.js', __FILE__ ), array(), RHXG_VER, true );
	wp_localize_script(
		'rhxg',
		'RHXG',
		array(
			'endpoint' => esc_url_raw( rest_url( 'rh-excel-gpt/v1/chat' ) ),
			'nonce'    => wp_create_nonce( 'wp_rest' ),
			'greeting' => $o['greeting'],
			'gptUrl'   => $o['gpt_url'],
			'live'     => ( ! empty( $o['enabled'] ) && ! empty( $o['api_key'] ) ) ? 1 : 0,
		)
	);

	ob_start();
	?>
	<div class="rhxg" id="rhxg-root" data-live="<?php echo esc_attr( ( ! empty( $o['enabled'] ) && ! empty( $o['api_key'] ) ) ? '1' : '0' ); ?>">
		<button class="rhxg__launch" type="button" aria-expanded="false" aria-controls="rhxg-panel">
			<span class="rhxg__launch-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24"><path d="M4 3h9l7 7v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M13 3v7h7" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 13.5l3.2 4.5M11.2 13.5L8 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
			</span>
			<span class="rhxg__launch-label"><?php esc_html_e( 'Ask about Excel', 'rh-excel-gpt' ); ?></span>
		</button>

		<div class="rhxg__panel" id="rhxg-panel" hidden>
			<div class="rhxg__head">
				<div>
					<p class="rhxg__kicker"><?php esc_html_e( 'Live GPT · Microsoft Excel', 'rh-excel-gpt' ); ?></p>
					<h3 class="rhxg__title"><?php esc_html_e( 'Excel Assistant', 'rh-excel-gpt' ); ?></h3>
				</div>
				<button class="rhxg__close" type="button" aria-label="<?php esc_attr_e( 'Close', 'rh-excel-gpt' ); ?>">&times;</button>
			</div>

			<div class="rhxg__log" role="log" aria-live="polite"></div>

			<form class="rhxg__form">
				<label class="rhxg__sr" for="rhxg-input"><?php esc_html_e( 'Ask an Excel question', 'rh-excel-gpt' ); ?></label>
				<input id="rhxg-input" class="rhxg__input" type="text" autocomplete="off" maxlength="1000"
					placeholder="<?php esc_attr_e( 'Ask anything about Excel…', 'rh-excel-gpt' ); ?>">
				<button class="rhxg__send" type="submit" aria-label="<?php esc_attr_e( 'Send', 'rh-excel-gpt' ); ?>">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5L21 12 3.5 3.5 3.5 10l12 2-12 2z" fill="currentColor"/></svg>
				</button>
			</form>

			<?php if ( $o['gpt_url'] ) : ?>
				<p class="rhxg__foot">
					<a href="<?php echo esc_url( $o['gpt_url'] ); ?>" target="_blank" rel="noopener noreferrer">
						<?php esc_html_e( 'Open the full Custom GPT ↗', 'rh-excel-gpt' ); ?>
					</a>
				</p>
			<?php endif; ?>
		</div>
	</div>
	<?php
	return ob_get_clean();
} );
