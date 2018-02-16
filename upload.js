var multer = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + file.originalname);
    }
});

var uploading = multer({
    storage: storage
}).single('image');

exports.handleUpload= (req, res) => {
    uploading(req, res, function (err) {
        console.log(req)
        if (err) {
            res.json({ error_code: 1, err_desc: err });
            return;
        }
        res.json({ error_code: 0, err_desc: null, filename: req.file.filename });
    })
}

exports.handleDownload= (req, res) => {
    res.sendFile(__dirname + '/uploads/' + req.params.file);
}