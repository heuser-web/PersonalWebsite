<?php
/**
 * Home page template.
 *
 * Renders the cinematic hero plus the "explore the rest of the site" sections
 * the project brief asks a home page to provide. If a static page is assigned
 * as the front page and it has body content, that content is printed too.
 *
 * @package roman-heuser
 */

get_header();

$rh_hero_img = get_theme_mod( 'rh_hero_image' );
if ( ! $rh_hero_img ) {
	$rh_hero_img = rh_img( 'vegas-night.jpg' );  // bundled fallback
}
$rh_logo_id  = get_theme_mod( 'custom_logo' );

/** The four interior destinations, in the order the project requires. */
$rh_destinations = array(
	array(
		'title' => 'About Me',
		'slug'  => 'about-me',
		'kicker'=> 'Chapter 01',
		'copy'  => 'Where I grew up, why I picked business, the four jobs that taught me more than any of it, and where this is going.',
	),
	array(
		'title' => 'Resume',
		'slug'  => 'resume',
		'kicker'=> 'Chapter 02',
		'copy'  => 'Two versions of the same resume — my original, and one I retooled for a product role using AI as an editor, not an author. The prompts are documented.',
	),
	array(
		'title' => 'Gallery',
		'slug'  => 'gallery',
		'kicker'=> 'Chapter 03',
		'copy'  => 'Photographs from the places, people and late nights behind the work. All my own images.',
	),
	array(
		'title' => 'Blog',
		'slug'  => 'blog',
		'kicker'=> 'Chapter 04',
		'copy'  => 'One long look at a scam I watched work in real life, how it was built, and the questions that would have stopped it.',
	),
);

/** The three ventures. Edit the copy here or move it to the page editor later. */
$rh_ventures = array(
	array(
		'name'  => 'GoMojo',
		'role'  => 'Founder',
		'blurb' => 'A free AI concierge for Las Vegas. You give it a vibe and a budget; six seconds later you have a real three-stop night with real venues, real times and real costs. Behind the answer is a seven-agent swarm that argues about budget, distance, timing and taste before it commits.',
		'facts' => array( '7-agent AI swarm', 'Installable PWA', 'Free tier, no ads', 'Reno + Sparks next' ),
	),
	array(
		'name'  => 'TagData',
		'role'  => 'Frontend Design Lead',
		'blurb' => 'A personal-data vault I was hired to redesign, with full authority over the frontend. The TagData ID turns any slice of your vault into a styled, scannable card — and the shared data lives inside the link itself, never on a server.',
		'facts' => array( '$3.5M invested', 'Full frontend authority', 'Token-driven design system', 'Next.js + .NET' ),
	),
	array(
		'name'  => 'GoInvest',
		'role'  => 'Builder',
		'blurb' => 'A multi-agent research sandbox where eight investor personas — momentum, quant, macro, value, biotech, forensic short — debate a ticker, vote, and log every argument and outcome to a database. Educational only, and deliberately paper-traded.',
		'facts' => array( '8 investor personas', 'Every debate logged', 'Paper trading only', 'Not investment advice' ),
	),
);
?>

<?php
/*
 * The opening crawl. Rendered on the front page only, hidden until JS decides
 * it should run — it never mounts under prefers-reduced-motion, and only once
 * per browser tab. cinematic.js owns the whole lifecycle.
 */
$rh_intro_logo = $rh_logo_id ? wp_get_attachment_image_url( $rh_logo_id, 'full' ) : rh_img( 'logo-hero-light.png' );
?>
<div class="rh-intro" id="rh-intro" hidden role="dialog" aria-modal="true" aria-label="<?php esc_attr_e( 'Site introduction', 'roman-heuser' ); ?>">
	<canvas class="rh-intro__warp" aria-hidden="true"></canvas>
	<div class="rh-intro__vignette" aria-hidden="true"></div>
	<div class="rh-intro__scan" aria-hidden="true"></div>
	<div class="rh-intro__grain" aria-hidden="true"></div>
	<div class="rh-intro__flare" aria-hidden="true"></div>
	<div class="rh-intro__flash" aria-hidden="true"></div>

	<div class="rh-intro__stage" aria-hidden="true">

		<p class="rh-beat rh-beat--boot" data-beat="boot"><span class="rh-boot__line"></span><i class="rh-caret"></i></p>

		<?php $rh_name = rh_opt( 'rh_intro_name' ); ?>
		<h2 class="rh-beat rh-beat--name" data-beat="name" data-text="<?php echo esc_attr( $rh_name ); ?>"><?php echo esc_html( $rh_name ); ?></h2>

		<?php
		rh_intro_card( 'rh_intro_c1', 'c1' );
		rh_intro_card( 'rh_intro_c2', 'c2' );
		rh_intro_card( 'rh_intro_c3', 'c3' );
		?>

		<div class="rh-beat rh-beat--sign" data-beat="sign">
			<img src="<?php echo esc_url( $rh_intro_logo ); ?>" alt="">
			<p class="rh-sign__tag"><?php echo wp_kses_post( rh_opt( 'rh_intro_tag' ) ); ?></p>
		</div>

	</div>

	<div class="rh-intro__prog" aria-hidden="true"><i></i></div>
	<button class="rh-intro__skip" type="button"><?php esc_html_e( 'Skip', 'roman-heuser' ); ?></button>
</div>
<template id="rh-intro-template"></template>

<section class="rh-hero">
	<canvas class="rh-fx rh-fx--interactive" id="rh-galaxy" role="img"
		aria-label="<?php esc_attr_e( 'Interactive particle galaxy. Drag to rotate.', 'roman-heuser' ); ?>"></canvas>

	<?php if ( $rh_hero_img ) : ?>
		<img class="rh-hero__bg" src="<?php echo esc_url( $rh_hero_img ); ?>" alt="" aria-hidden="true" fetchpriority="high">
	<?php endif; ?>

	<div class="rh-edge">
		<?php if ( rh_opt( 'rh_hero_eyebrow' ) ) : ?>
			<p class="rh-hero__eyebrow"><?php echo esc_html( wp_strip_all_tags( rh_opt( 'rh_hero_eyebrow' ) ) ); ?></p>
		<?php endif; ?>

		<?php
		if ( $rh_logo_id ) {
			echo wp_get_attachment_image(
				$rh_logo_id,
				'full',
				false,
				array(
					'class'         => 'rh-hero__logo',
					'alt'           => esc_attr( get_bloginfo( 'name' ) ),
					'fetchpriority' => 'high',
				)
			);
		}
		?>

		<h1><?php echo wp_kses_post( rh_opt( 'rh_hero_title' ) ); ?></h1>
		<p class="rh-hero__sub"><?php echo wp_kses_post( rh_opt( 'rh_hero_sub' ) ); ?></p>

		<div class="rh-hero__cta">
			<?php if ( rh_opt( 'rh_hero_cta1_txt' ) ) : ?>
				<a class="rh-btn rh-btn--primary" href="<?php echo esc_url( rh_opt( 'rh_hero_cta1_url' ) ); ?>">
					<?php echo esc_html( rh_opt( 'rh_hero_cta1_txt' ) ); ?>
					<span class="rh-btn__arrow" aria-hidden="true">&rarr;</span>
				</a>
			<?php endif; ?>
			<?php if ( rh_opt( 'rh_hero_cta2_txt' ) ) : ?>
				<a class="rh-btn rh-btn--ghost" style="color:#F7F5EF" href="<?php echo esc_url( rh_opt( 'rh_hero_cta2_url' ) ); ?>">
					<?php echo esc_html( rh_opt( 'rh_hero_cta2_txt' ) ); ?>
				</a>
			<?php endif; ?>
		</div>
	</div>

	<a class="rh-hero__scroll" href="#rh-ventures"><?php esc_html_e( 'Scroll', 'roman-heuser' ); ?></a>
</section>


<!-- ============================ VENTURES ============================ -->
<section class="rh-section rh-aurora-band" id="rh-ventures">
	<div class="rh-edge">
		<p class="rh-eyebrow rh-reveal"><?php esc_html_e( 'What I am building', 'roman-heuser' ); ?></p>
		<h2 class="rh-reveal" style="max-width:20ch"><?php esc_html_e( 'Three products, one habit: ship it, then make it good.', 'roman-heuser' ); ?></h2>
		<p class="rh-lede rh-reveal" style="margin-bottom:3rem">
			<?php esc_html_e( 'I would rather have something running badly on a real server than something perfect in a document. Every project below started as a weekend idea and ended up as software other people actually use.', 'roman-heuser' ); ?>
		</p>

		<div class="rh-grid rh-grid--3">
			<?php foreach ( $rh_ventures as $rh_v ) : ?>
				<article class="rh-card rh-card--hover rh-reveal rh-glass rh-tilt">
					<span class="rh-tilt__sheen" aria-hidden="true"></span>
					<p class="rh-card__kicker"><?php echo esc_html( $rh_v['role'] ); ?></p>
					<h3><?php echo esc_html( $rh_v['name'] ); ?></h3>
					<p><?php echo esc_html( $rh_v['blurb'] ); ?></p>
					<ul class="rh-chips">
						<?php foreach ( $rh_v['facts'] as $rh_f ) : ?>
							<li><?php echo esc_html( $rh_f ); ?></li>
						<?php endforeach; ?>
					</ul>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>


<!-- ============================ STATS ============================ -->
<section class="rh-section rh-section--alt">
	<div class="rh-edge">
		<p class="rh-eyebrow rh-eyebrow--center rh-reveal" style="justify-content:center"><?php esc_html_e( 'By the numbers', 'roman-heuser' ); ?></p>
		<div class="rh-stats rh-reveal">
			<div class="rh-stat">
				<div class="rh-stat__num">3</div>
				<div class="rh-stat__label"><?php esc_html_e( 'Products shipped', 'roman-heuser' ); ?></div>
			</div>
			<div class="rh-stat">
				<div class="rh-stat__num">&lt;<span>$1K</span></div>
				<div class="rh-stat__label"><?php esc_html_e( 'Total build cost, GoMojo', 'roman-heuser' ); ?></div>
			</div>
			<div class="rh-stat">
				<div class="rh-stat__num">15</div>
				<div class="rh-stat__label"><?php esc_html_e( 'AI agents in production', 'roman-heuser' ); ?></div>
			</div>
			<div class="rh-stat">
				<div class="rh-stat__num">6<span>s</span></div>
				<div class="rh-stat__label"><?php esc_html_e( 'To plan a night out', 'roman-heuser' ); ?></div>
			</div>
		</div>
	</div>
</section>


<!-- ============================ EXPLORE ============================ -->
<section class="rh-section">
	<div class="rh-edge">
		<p class="rh-eyebrow rh-reveal"><?php esc_html_e( 'Start anywhere', 'roman-heuser' ); ?></p>
		<h2 class="rh-reveal" style="margin-bottom:2.5rem"><?php esc_html_e( 'The rest of the site', 'roman-heuser' ); ?></h2>

		<div class="rh-grid rh-grid--2">
			<?php foreach ( $rh_destinations as $rh_d ) : ?>
				<?php $rh_url = rh_page_url_by_title( $rh_d['title'] ); ?>
				<a class="rh-card rh-reveal rh-glass rh-tilt" href="<?php echo esc_url( $rh_url ); ?>">
					<span class="rh-tilt__sheen" aria-hidden="true"></span>
					<p class="rh-card__kicker"><?php echo esc_html( $rh_d['kicker'] ); ?></p>
					<h3><?php echo esc_html( $rh_d['title'] ); ?></h3>
					<p><?php echo esc_html( $rh_d['copy'] ); ?></p>
					<span class="rh-card__foot">
						<?php esc_html_e( 'Open', 'roman-heuser' ); ?>
						<span class="rh-btn__arrow" aria-hidden="true">&rarr;</span>
					</span>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>


<!-- ================= OPTIONAL PAGE BODY (if one is set) ================= -->
<?php
if ( have_posts() ) :
	while ( have_posts() ) :
		the_post();
		$rh_body = trim( get_the_content() );
		if ( $rh_body ) :
			?>
			<section class="rh-section rh-section--alt">
				<div class="rh-edge rh-article"><?php the_content(); ?></div>
			</section>
			<?php
		endif;
	endwhile;
endif;
?>


<!-- ============================ LATEST POST ============================ -->
<?php
$rh_latest = new WP_Query(
	array(
		'posts_per_page'      => 1,
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	)
);
if ( $rh_latest->have_posts() ) :
	while ( $rh_latest->have_posts() ) :
		$rh_latest->the_post();
		?>
		<section class="rh-section">
			<div class="rh-edge">
				<p class="rh-eyebrow rh-reveal"><?php esc_html_e( 'From the blog', 'roman-heuser' ); ?></p>
				<div class="rh-split rh-reveal">
					<?php if ( has_post_thumbnail() ) : ?>
						<div class="rh-split__media"><?php the_post_thumbnail( 'rh-card' ); ?></div>
					<?php endif; ?>
					<div>
						<h3 style="font-size:clamp(1.6rem,1.2rem + 1.6vw,2.4rem)"><?php the_title(); ?></h3>
						<p class="rh-lede"><?php echo esc_html( get_the_excerpt() ); ?></p>
						<a class="rh-btn rh-btn--primary" href="<?php the_permalink(); ?>" style="margin-top:.75rem">
							<?php esc_html_e( 'Read the post', 'roman-heuser' ); ?>
							<span class="rh-btn__arrow" aria-hidden="true">&rarr;</span>
						</a>
					</div>
				</div>
			</div>
		</section>
		<?php
	endwhile;
	wp_reset_postdata();
endif;

get_footer();
