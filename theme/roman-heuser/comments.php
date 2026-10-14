<?php
/**
 * Comments template.
 *
 * The blog post is graded on four approved comments and four replies, so this
 * template leads with the count, renders threads clearly, and marks the site
 * author's replies with a brass "Author" badge.
 *
 * @package roman-heuser
 */

if ( post_password_required() ) {
	return;
}
?>

<div id="comments" class="rh-comments">

	<?php if ( have_comments() ) : ?>

		<p class="rh-eyebrow">
			<?php
			$rh_count = get_comments_number();
			printf(
				/* translators: %s: comment count */
				esc_html( _n( '%s response', '%s responses', $rh_count, 'roman-heuser' ) ),
				esc_html( number_format_i18n( $rh_count ) )
			);
			?>
		</p>

		<ol class="comment-list">
			<?php
			wp_list_comments(
				array(
					'style'       => 'ol',
					'callback'    => 'rh_comment',
					'avatar_size' => 52,
				)
			);
			?>
		</ol>

		<?php
		the_comments_pagination(
			array(
				'class'     => 'rh-pagination',
				'prev_text' => esc_html__( 'Older', 'roman-heuser' ),
				'next_text' => esc_html__( 'Newer', 'roman-heuser' ),
			)
		);
		?>

	<?php endif; ?>

	<?php if ( ! comments_open() && get_comments_number() ) : ?>
		<p class="rh-meta"><?php esc_html_e( 'Comments are closed.', 'roman-heuser' ); ?></p>
	<?php endif; ?>

	<?php
	$rh_req = get_option( 'require_name_email' );

	comment_form(
		array(
			'title_reply'          => __( 'Join the conversation', 'roman-heuser' ),
			'title_reply_to'       => __( 'Replying to %s', 'roman-heuser' ),
			'cancel_reply_link'    => __( 'Cancel reply', 'roman-heuser' ),
			'title_reply_before'   => '<h3 id="reply-title" class="comment-reply-title">',
			'title_reply_after'    => '</h3>',
			'class_form'           => 'comment-form rh-commentform',
			'class_submit'         => 'rh-btn rh-btn--primary',
			'label_submit'         => __( 'Post comment', 'roman-heuser' ),
			'comment_notes_before' => '<p class="rh-formnote">' . esc_html__(
				'Every comment is read before it appears, so give it a minute. Your email is never published.',
				'roman-heuser'
			) . '</p>',
			'comment_notes_after'  => '',
			'comment_field'        =>
				'<p class="comment-form-comment"><label for="comment">' . esc_html__( 'Your comment', 'roman-heuser' ) . '</label>' .
				'<textarea id="comment" name="comment" rows="6" required placeholder="' .
				esc_attr__( 'What did this make you think of?', 'roman-heuser' ) . '"></textarea></p>',
			'fields'               => array(
				'author' =>
					'<p class="comment-form-author"><label for="author">' . esc_html__( 'Name', 'roman-heuser' ) .
					( $rh_req ? ' <span class="req">*</span>' : '' ) . '</label>' .
					'<input id="author" name="author" type="text" value="" maxlength="245" ' .
					( $rh_req ? 'required' : '' ) . '></p>',
				'email'  =>
					'<p class="comment-form-email"><label for="email">' . esc_html__( 'Email', 'roman-heuser' ) .
					( $rh_req ? ' <span class="req">*</span>' : '' ) . '</label>' .
					'<input id="email" name="email" type="email" value="" maxlength="100" ' .
					( $rh_req ? 'required' : '' ) . '>' .
					'<span class="rh-formhint">' . esc_html__( 'Not published. Used for your avatar.', 'roman-heuser' ) . '</span></p>',
			),
		)
	);
	?>
</div>
