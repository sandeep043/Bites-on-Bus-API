const { PayData } = require("../pay.config");
const crypto = require("crypto");
const Payment = require('../model/paymentModel');
const Order = require('../model/orderModel'); // Add this at the top with other requires

// POST /get-payment
const getPayment = async (req, res) => {
    try {
        const txn_id = 'PAYU_MONEY_' + Math.floor(Math.random() * 8888888);
        // PNRresponse: order.PNRresponse,
        //                         customerDetails: order.customerDetails,
        //                         orderItems: order.Orderitems,
        //                         restaurant_id: order.restaurant_id,
        //                         orderTimeandDate: order.orderTimeandDate,
        const { amount, product, firstname, email, mobile, PNRresponse, customerDetails, orderItems, restaurant_id, orderTimeandDate, user_id, DeliveryLocation } = req.body;



        let udf1 = PNRresponse ? JSON.stringify(PNRresponse) : "";
        let udf2 = customerDetails ? JSON.stringify(customerDetails) : "";
        let udf3 = orderItems ? JSON.stringify(orderItems) : "";
        let udf4 = restaurant_id ? String(restaurant_id) : "";
        let udf5 = DeliveryLocation ? JSON.stringify(DeliveryLocation) : "";

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
            created_at: new Date(),
            userId: user_id,
            orderTimeandDate: orderTimeandDate,
            orderItems: orderItems,
            restaurant_id: restaurant_id,
            // Store UDF mappings for clarity
            // PNRresponse,
            // customerDetails,
            // orderItems,
            // restaurant_id,
            // orderTimeandDate
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
            hash,
            udf1,
            udf2,
            udf3,
            udf4,
            udf5
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

        // Create order if payment is successful
        if (data.status === 'success') {
            // Parse UDF fields
            let PNRresponse = data.udf1 ? JSON.parse(data.udf1) : undefined;
            let customerDetails = data.udf2 ? JSON.parse(data.udf2) : undefined;
            let restaurant_id = data.udf4;
            let DeliveryLocation = data.udf5 ? JSON.parse(data.udf5) : undefined;

            // Fetch userId from Payment document
            const paymentDoc = await Payment.findById(payment_id);
            const userId = paymentDoc ? paymentDoc.userId : undefined;
            const orderTimeandDate = paymentDoc ? paymentDoc.orderTimeandDate : new Date();
            const orderItems = paymentDoc ? paymentDoc.orderItems : [];
            console.log(data);
            // Prepare order object
            const orderObj = {
                userId,
                stop: DeliveryLocation ? DeliveryLocation.stop : undefined,
                city: DeliveryLocation ? DeliveryLocation.city : undefined,
                restaurantId: restaurant_id,
                orderTimeandDate: orderTimeandDate,
                customerDetails: customerDetails,
                Orderitems: orderItems,
                totalAmount: data.amt,
                paymentId: payment_id,
                status: 'Placed',
                // Set PNR from PNRresponse.PNR_ID if available
                PNR: (PNRresponse && PNRresponse.PNR_ID) ? PNRresponse.PNR_ID : undefined
            };

            await Order.create(orderObj);
        }

        res.redirect(`http://localhost:3000/payment/${data.status}/${data.txnid}/${payment_id}`);
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