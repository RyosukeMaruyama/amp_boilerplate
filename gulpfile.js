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

gulp.task('amphtml:validate', () => {
    return gulp.src(`${paths.src}/index.amp_base.html`)
        .pipe(gulpAmpValidator.validate())
        .pipe(gulpAmpValidator.format())
    // .pipe(gulpAmpValidator.failAfterError());
});

gulp.task('styles', () => {
    return gulp.src([`${paths.src}/css/**/*.scss`])
        .pipe(plumber(
            {   // エラー抑制
                errorHandler: function (err) {
                    console.log(err);
                }
            }))
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCss({ compatibility: 'ie8' })) // cssを圧縮
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(`${paths.src}/css`));
});

gulp.task('inject-styles', function () {
    return gulp.src(`${paths.src}/index.amp_base.html`)
        // gulp-injectを使いamp.html内のコメントに生成されたcssの内容を挿入する
        .pipe(inject(gulp.src([`${paths.src}/css/style.css`]), {
            starttag: '<!-- inject:inline-style:start -->',
            endtag: '<!-- inject:inline-style:end -->',
            relative: true,
            removeTags: true,
            transform: (filePath, file) => {
                const styleTagStart = '<style amp-custom>';
                const styleTagEnd = '</style>';

                // スタイルの中身をstyle属性内用に加工していきます。
                let styles = file.contents.toString('utf8');
                // パスを相対パスを変更する。
                styles = styles.replace('url(../', 'url(');
                // sassコンパイル時に生成される行を削除する
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

gulp.task('html-replace', function () {
    return gulp.src(`${paths.dist}/index.html`)
        .pipe(replace('src="../images', 'src="images'))
        .pipe(gulp.dest(`${paths.dist}`))
});

gulp.task('copy-images', function () {
    return gulp.src(`images/**`)
        .pipe(gulp.dest(`${paths.dist}/images`))
});

gulp.task('ampdev', gulp.series('styles', 'inject-styles', 'amphtml:validate', 'html-replace', 'copy-images', (callback) => {
    callback();
}));

gulp.task('default', gulp.series('ampdev', (callback) => {
    gulp.watch(`${paths.src}/css/style.scss`, gulp.series('ampdev'));
    gulp.watch(`${paths.src}/index.amp_base.html`, gulp.series('ampdev'));
    callback();
}));