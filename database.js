var moment = require('moment');

var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var connectionUrl = 'mongodb://127.0.0.1:27017/giga4';
var dbName= 'giga4'

const mailing = require('./mailing')
const socket= require('./socket')

var db

function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({ "error": message });
}

exports.init= (fnApplicationInit) => {
    mongodb.MongoClient.connect(connectionUrl, function (err, database) {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        
        // Save database object from the callback for reuse.
        db = database.db(dbName)
        
        database.on('close', function () {    // TEST THIS!!!!!!
            console.log('Error...close');
            mailing.ggMailTo('kvasza@gmail.com', 'Mongo server is down', '');
          });	
        
        console.log("Database connection ready");
        
        // Initialize the app.
        fnApplicationInit()
    })       
}

exports.handleGet= (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    db.collection(req.params.type).find({}).toArray(function (err, docs) {
        if (err) {
            handleError(res, err.message, 'Failed to get ' + req.params.type + '.');
        } else {
            res.status(200).json(docs);
        }
    });
}

exports.handleGetSingle= (req, res) => {
    db.collection(req.params.type).findOne({ _id: new ObjectID(req.params.id) }, function (err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to get " + req.params.type);
        } else {
            res.status(200).json(doc);
        }
    });
}

exports.handlePost= (req, res) => {
    var newData = req.body;
    newData.createDate = moment().format('DD/MM/YYYY HH:mm:ss');
    
    db.collection(req.params.type).insertOne(newData, function (err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to create new " + req.params.type);
        } else {
            socket.broadcast({ 'collectionsUpdated' : [req.params.type] })
            res.status(201).json(doc.ops[0]);
        }
    });
}

exports.handlePut = (req, res) => {
    var updateDoc = req.body;
    delete updateDoc._id;
    
    db.collection(req.params.type).updateOne({ _id: new ObjectID(req.params.id) }, updateDoc, function (err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to update " + req.params.type);
        } else {
            socket.broadcast({ 'collectionsUpdated' : [req.params.type] })
            res.status(204).end();
        }
    });
}

exports.handleDelete = (req, res) => {
    db.collection(req.params.type).deleteOne({ _id: new ObjectID(req.params.id) }, function (err, result) {
        if (err) {
            handleError(res, err.message, "Failed to delete " + req.params.type);
        } else {
            socket.broadcast({ 'collectionsUpdated' : [req.params.type] })
            res.status(204).end();
        }
    });
}

exports.handleService= (req, res) => {
    var parameter = req.body;
    
    switch (req.params.type) {
        case 'ordersupdated':
            socket.broadcast({ 'collectionsUpdated' : ['orders'] });
            res.status(200).json({});
            break;
        case 'sapmapupdated':
            socket.broadcast({ 'collectionsUpdated' : ['sap.engage.map'] });
            res.status(200).json({});
            break;
        case 'sapupdated':
            socket.broadcast({ 'collectionsUpdated' : ['sap.engage','sap.facture','sap.fusion','sap.supplier','sap.engage.map'] });
            res.status(200).json({});
            break;
        case 'passOrder':     
            handleServicePassOrder(parameter, req, res)           
            break;
        case 'createVoucher':
            handleServiceCreateVoucher(parameter, req, res)
            break
        case 'useVoucher':
            handleServiceUseVoucher(parameter, req, res)
            break
        default:
    }
}

var handleServicePassOrder= (parameter, req, res) => {
    db.createCollection('counters', function (err, counterCollection) {  // will ignore the creation if the collection already exists
        counterCollection.findAndModify({_id: 'orders' }, [], { $setOnInsert: { _id: 'orders', counter: 1000 } }, { new: true, upsert: true }, function (err, counterDocument) {
            counterCollection.findAndModify({ _id: 'orders' }, [], { $inc: { counter: 1 } }, { new: true }, function (err, counterDocument) {
                parameter.data.date = moment().format('DD/MM/YYYY HH:mm:ss')
                parameter.data.status = { history: [{ date: moment().format('DD/MM/YYYY HH:mm:ss'), value: 'created' }], value: 'created' } ; 
                parameter.data.kid = +counterDocument.value.counter;

                db.collection('orders').insertOne(parameter.data, function (err, doc) {
                    if (err) {
                        handleError(res, err.message, "Failed to create new " + req.params.type);
                    } else {
                        parameter.basketItems.forEach(function (id) {
                            db.collection('basket').remove({ "_id": new ObjectID(id) });
                        });
                        res.status(201).json(doc.ops[0]);
                        socket.broadcast({ 'collectionsUpdated' : ['orders','basket'] })
                    }
                });
            });
        });
    });
}

var handleServiceUseVoucher= (parameter, req, res) => {
    if(parameter.amount > 200000) {
        res.status(201).json({
            error: 'not enough budget'
        });
    }
    else {
        db.collection('orders.vouchers').findOne({ userId: parameter.userId, supplierId: parameter.supplierId, categoryId: parameter.categoryId, shopping : { $exists: false } }, function (err, voucher) {
            if (err) {
                handleError(res, err.message, "Failed to get Voucher");
            }
            else {
                if (voucher) {
                    voucher.shopping = {
                        date : moment().format('DD/MM/YYYY HH:mm:ss'),
                        description: parameter.description,
                        total: parameter.amount,
                        equipeId: parameter.equipeId
                    }
                    db.collection('orders.vouchers').updateOne({ _id: new ObjectID(voucher._id) }, voucher, function (err, voucher2) {
                        if (err) {
                            handleError(res, err.message, "Failed to update " + req.params.type);
                        } else {
                            res.status(201).json({
                                sapId: voucher.sapId
                            });
                            socket.broadcast({ 'collectionsUpdated' : ['orders.vouchers'] })
                        }
                    })
                }
                else {
                    res.status(201).json({
                        error: 'no voucher available'
                    });
                }
            }
        })           
    }

}

var handleServiceCreateVoucher= (parameter, req, res) => {
    parameter.dateCreation = moment().format('DD/MM/YYYY HH:mm:ss')
    db.collection('orders.vouchers').insertOne(parameter, function (err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to create new " + req.params.type);
        } else {
            db.collection('users.krino').findOne({ _id: new ObjectID(parameter.userId) }, function (err, user) {
                if (err) {
                    handleError(res, err.message, "Failed to get User");
                }
                else {
                    if (user && user.voucherRequests) {
                        var request = user.voucherRequests.filter(function (req) { return req.supplierId === parameter.supplierId && req.categoryId === parameter.categoryId && req.quantity > 0 })[0];
                        if (request && request.quantity === 1) {
                            var index = user.voucherRequests.indexOf(request)
                            user.voucherRequests.splice(index,1)
                        }
                        else {
                            request.quantity--
                        }
                        db.collection('users.krino').updateOne({ _id: new ObjectID(parameter.userId) }, user, function (err, doc2) {
                            if (err) {
                                handleError(res, err.message, "Failed to update " + req.params.type);
                            } else {
                                socket.broadcast({'collectionsUpdated' : ['orders.vouchers', 'users.krino']})
                                res.status(201).json(doc.ops[0]);
                            }
                        });
                    }
                }                                        
            })
        }
    });
}