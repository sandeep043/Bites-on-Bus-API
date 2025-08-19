const Payment = require('../model/paymentModel');
// Ensure Payment.create is a Jest mock before requiring the controller
Payment.create = jest.fn();

const paymentController = require('../controller/paymentController');
const Order = require('../model/orderModel');
const { PayData } = require('../pay.config');

jest.mock('../model/paymentModel');
jest.mock('../model/orderModel');
jest.mock('../pay.config', () => ({
    PayData: {
        payu_key: '5CWhYy',
        payu_salt: 'blJRjgXnW7BJZQof2pj45UrQaAHZC1VC',
        payuClient: {
            paymentInitiate: jest.fn(),
            verifyPayment: jest.fn()
        }
    }
}));

describe('paymentController', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            redirect: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('getPayment', () => {
        // it('should initiate payment and respond with payuClient data', async () => {
        //     req.body = {
        //         amount: 100,
        //         product: 'prod',
        //         firstname: 'John',
        //         email: 'john@email.com',
        //         mobile: '1234567890',
        //         user_id: 'userId',
        //         orderTimeandDate: new Date(),
        //         orderItems: [],
        //         restaurant_id: 'restId',
        //         DeliveryLocation: { stop: 'stop', city: 'city' }
        //     };
        //     Payment.create.mockResolvedValue({ _id: 'payId' });
        //     PayData.payuClient.paymentInitiate.mockResolvedValue({ payment: 'data' });
        //     await paymentController.getPayment(req, res);
        //     expect(Payment.create).toHaveBeenCalled();
        //     expect(PayData.payuClient.paymentInitiate).toHaveBeenCalled();
        //     expect(res.send).toHaveBeenCalledWith({ payment: 'data' });
        // });

        it('should handle errors', async () => {
            Payment.create.mockRejectedValue(new Error('fail'));
            await paymentController.getPayment(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                msg: expect.any(String),
                stack: expect.any(String)
            });
        });
    });

    describe('verifyPayment', () => {
        it('should verify payment and redirect on success', async () => {
            req.params.txnid = 'TXN123';
            req.query.payment_id = 'payId';
            PayData.payuClient.verifyPayment.mockResolvedValue({
                transaction_details: {
                    TXN123: {
                        txnid: 'TXN123',
                        status: 'success',
                        mode: 'online',
                        error_Message: '',
                        addedon: '2024-01-01T00:00:00Z',
                        amt: 100,
                        udf1: JSON.stringify({ PNR_ID: 'PNR123' }),
                        udf2: JSON.stringify({ name: 'John' }),
                        udf4: 'restId',
                        udf5: JSON.stringify({ stop: 'stop', city: 'city' })
                    }
                }
            });
            Payment.findOneAndUpdate.mockResolvedValue({});
            Payment.findById.mockResolvedValue({
                userId: 'userId',
                orderTimeandDate: new Date(),
                orderItems: [],
            });
            Order.create.mockResolvedValue({ _id: 'orderId' });

            await paymentController.verifyPayment(req, res);
            expect(PayData.payuClient.verifyPayment).toHaveBeenCalledWith('TXN123');
            expect(Payment.findOneAndUpdate).toHaveBeenCalled();
            expect(Order.create).toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/payment/success/TXN123/payId/orderId'));
        });

        it('should verify payment and redirect on failure', async () => {
            req.params.txnid = 'TXN123';
            req.query.payment_id = 'payId';
            PayData.payuClient.verifyPayment.mockResolvedValue({
                transaction_details: {
                    TXN123: {
                        txnid: 'TXN123',
                        status: 'failure',
                        mode: 'online',
                        error_Message: 'error',
                        addedon: '2024-01-01T00:00:00Z',
                        amt: 100,
                        udf1: '',
                        udf2: '',
                        udf4: 'restId',
                        udf5: ''
                    }
                }
            });
            Payment.findOneAndUpdate.mockResolvedValue({});
            Payment.findById.mockResolvedValue({});
            await paymentController.verifyPayment(req, res);
            expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/payment/failure/TXN123/payId/'));
        });

        it('should handle errors', async () => {
            req.params.txnid = 'TXN123';
            PayData.payuClient.verifyPayment.mockRejectedValue(new Error('fail'));
            await paymentController.verifyPayment(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                msg: expect.any(String),
                stack: expect.any(String)
            });
        });
    });
});
