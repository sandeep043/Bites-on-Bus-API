
const { PayData } = require("../pay.config");
const crypto = require("crypto");
const Payment = require('../model/paymentModel');

// POST /get-payment
const getPayment = async (req, res) => {
    try {
        const txn_id = 'PAYU_MONEY_' + Math.floor(Math.random() * 8888888);
        const { amount, product, firstname, email, mobile } = req.body;

        let udf1 = '';
        let udf2 = '';
        let udf3 = '';
        let udf4 = '';
        let udf5 = '';

        const hashString = `${PayData.payu_key}|${txn_id}|${amount}|${JSON.stringify(product)}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${PayData.payu_salt}`;
        const hash = crypto.createHash('sha512').update(hashString).digest('hex');

        // Use process.env.PORT or default to 4000
        const port = process.env.PORT || 4000;

        const paymentInitData = {
            txnid: txn_id,
            amount,
            currency: 'INR',
            productinfo: JSON.stringify(product),
            firstname,
            email,
            phone: mobile,
            status: 'initiated',
            created_at: new Date()
        };
        // Save initial payment data and get the created document
        const createdPayment = await Payment.create(paymentInitData);

        const data = await PayData.payuClient.paymentInitiate({
            isAmountFilledByCustomer: false,
            txnid: txn_id,
            amount: amount,
            currency: 'INR',
            productinfo: JSON.stringify(product),
            firstname: firstname,
            email: email,
            phone: mobile,
            surl: `http://localhost:${port}/api/payment/verify/${txn_id}?payment_id=${createdPayment._id}`,
            furl: `http://localhost:${port}/api/payment/verify/${txn_id}?payment_id=${createdPayment._id}`,
            hash
        });
        res.send(data);
    } catch (error) {
        res.status(400).send({
            msg: error.message,
            stack: error.stack
        });
    }
};

// POST /verify/:txnid
const verifyPayment = async (req, res) => {
    try {
        const verified_Data = await PayData.payuClient.verifyPayment(req.params.txnid);
        const data = verified_Data.transaction_details[req.params.txnid];
        console.log(data);

        // Save/update payment verification result
        const payment_id = req.query.payment_id;
        await Payment.findOneAndUpdate(
            { txnid: data.txnid },
            {
                status: data.status,
                mode: data.mode,
                error_Message: data.error_Message,
                addedon: data.addedon ? new Date(data.addedon) : undefined
            },
            { new: true, upsert: true }
        );

        res.redirect(`http://localhost:5173/payment/${data.status}/${data.txnid}/${payment_id}`);
    } catch (error) {
        res.status(400).send({
            msg: error.message,
            stack: error.stack
        });
    }
};

module.exports = {
    getPayment,
    verifyPayment
};