const gulp = require('gulp');
const inject = require('gulp-inject');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const cleanCss = require('gulp-clean-css');
const runSequence = require('run-sequence');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const gulpAmpValidator = require('gulp-amphtml-validator');

const paths = {
    src: 'src',
    dist: 'dist'
};

/**
 * Validate html in conformity to AMP
 */
gulp.task('amphtml:validate', () => {
    return gulp.src(`${paths.src}/index.amp_base.html`)
        .pipe(gulpAmpValidator.validate())
        .pipe(gulpAmpValidator.format())
});

/**
 * Build sass to css
 */
gulp.task('styles', () => {
    return gulp.src([`${paths.src}/css/**/*.scss`])
        .pipe(plumber(
            {
                errorHandler: function (err) {
                    console.log(err);
                }
            }))
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCss({ compatibility: 'ie8' }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(`${paths.src}/css`));
});

/**
 * Inject css to html with inline
 */
gulp.task('inject-styles', function () {
    return gulp.src(`${paths.src}/index.amp_base.html`)
        .pipe(inject(gulp.src([`${paths.src}/css/style.css`]), {
            starttag: '<!-- inject:inline-style:start -->',
            endtag: '<!-- inject:inline-style:end -->',
            relative: true,
            removeTags: true,
            transform: (filePath, file) => {
                const styleTagStart = '<style amp-custom>';
                const styleTagEnd = '</style>';

                let styles = file.contents.toString('utf8');
                // Change relative path at css in conformity to dist
                styles = styles.replace('url(../', 'url(');
                // Delete unnecessary sting
                styles = styles.replace(/\/\*\#\ssourceMappingURL\=.*\.map\s\*\//i, '');
                styles = styles.replace(/\@charset \"utf-8\"\;/i, '').trim();

                return styleTagStart
                    + styles
                    + styleTagEnd;
            }
        }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest(`${paths.dist}`))
});

/**
 * Change relative path at html in conformity to dist
 */
gulp.task('html-replace', function () {
    return gulp.src(`${paths.dist}/index.html`)
        .pipe(replace('src="../images', 'src="images'))
        .pipe(gulp.dest(`${paths.dist}`))
});

/**
 * Move image directory to dist
 */
gulp.task('copy-images', function () {
    return gulp.src(`images/**`)
        .pipe(gulp.dest(`${paths.dist}/images`))
});

/**
 * Execute build task
 */
gulp.task('ampdev', gulp.series('styles', 'inject-styles', 'amphtml:validate', 'html-replace', 'copy-images', (callback) => {
    callback();
}));

gulp.task('default', gulp.series('ampdev', (callback) => {
    gulp.watch(`${paths.src}/css/style.scss`, gulp.series('ampdev'));
    gulp.watch(`${paths.src}/index.amp_base.html`, gulp.series('ampdev'));
    callback();
}));