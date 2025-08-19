const controller = require('../controller/PNRPassengersDetailsController');
const PNRPassengersDetails = require('../model/PNRPassengersDetails');

jest.mock('../model/PNRPassengersDetails');

describe('PNRPassengersDetailsController', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('getAllPNRPassengersDetails', () => {
        it('should return all passengers', async () => {
            PNRPassengersDetails.find.mockResolvedValue([{ pnr: '123' }]);
            await controller.getAllPNRPassengersDetails(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ pnr: '123' }]);
        });

        it('should handle errors', async () => {
            PNRPassengersDetails.find.mockRejectedValue(new Error('fail'));
            await controller.getAllPNRPassengersDetails(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching passenger details', error: expect.anything() });
        });
    });

    describe('getPNRPassengersDetailsByPNR', () => {
        it('should return passenger by PNR', async () => {
            req.params.pnr = '123';
            PNRPassengersDetails.findOne.mockResolvedValue({ pnr: '123' });
            await controller.getPNRPassengersDetailsByPNR(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ pnr: '123' });
        });

        it('should return 404 if not found', async () => {
            req.params.pnr = '123';
            PNRPassengersDetails.findOne.mockResolvedValue(null);
            await controller.getPNRPassengersDetailsByPNR(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Passenger not found for given PNR' });
        });

        it('should handle errors', async () => {
            req.params.pnr = '123';
            PNRPassengersDetails.findOne.mockRejectedValue(new Error('fail'));
            await controller.getPNRPassengersDetailsByPNR(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching passenger by PNR', error: expect.anything() });
        });
    });

    describe('createPNRPassengerDetail', () => {
        it('should create new passenger detail', async () => {
            const savedPassenger = { pnr: 'PNR1123' };
            PNRPassengersDetails.mockImplementationOnce(() => ({
                save: jest.fn().mockResolvedValue(savedPassenger)
            }));
            req.body = { pnr: '123' };
            await controller.createPNRPassengerDetail(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should handle errors', async () => {
            PNRPassengersDetails.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValue(new Error('fail'))
            }));
            req.body = { pnr: '123' };
            await controller.createPNRPassengerDetail(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error creating passenger detail', error: expect.anything() });
        });
    });

    describe('updatePNRPassengerDetail', () => {
        it('should update passenger detail by PNR', async () => {
            req.params.pnr = '123';
            req.body = { name: 'Updated' };
            PNRPassengersDetails.findOneAndUpdate.mockResolvedValue({ pnr: '123', name: 'Updated' });
            await controller.updatePNRPassengerDetail(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ pnr: '123', name: 'Updated' });
        });

        it('should return 404 if not found', async () => {
            req.params.pnr = '123';
            PNRPassengersDetails.findOneAndUpdate.mockResolvedValue(null);
            await controller.updatePNRPassengerDetail(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Passenger not found for given PNR' });
        });

        it('should handle errors', async () => {
            req.params.pnr = '123';
            PNRPassengersDetails.findOneAndUpdate.mockRejectedValue(new Error('fail'));
            await controller.updatePNRPassengerDetail(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error updating passenger detail', error: expect.anything() });
        });
    });

    describe('deletePNRPassengerDetail', () => {
        it('should delete passenger detail by PNR', async () => {
            req.params.pnr = '123';
            PNRPassengersDetails.findOneAndDelete.mockResolvedValue({ pnr: '123' });
            await controller.deletePNRPassengerDetail(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Passenger deleted successfully' });
        });

        it('should return 404 if not found', async () => {
            req.params.pnr = '123';
            PNRPassengersDetails.findOneAndDelete.mockResolvedValue(null);
            await controller.deletePNRPassengerDetail(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Passenger not found for given PNR' });
        });

        it('should handle errors', async () => {
            req.params.pnr = '123';
            PNRPassengersDetails.findOneAndDelete.mockRejectedValue(new Error('fail'));
            await controller.deletePNRPassengerDetail(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error deleting passenger detail', error: expect.anything() });
        });
    });
});
