import { Router, Request, Response } from 'express';
import { State } from '../models/state.model';
import { District } from '../models/district.model';
import { Taluks } from '../models/taluks.model';
import { Pincode } from '../models/pincode.model';

const router = Router();

// GET all states
router.get('/states', async (_req: Request, res: Response) => {
  try {
    const states = await State.find({
      State: { $exists: true, $nin: [null, ""] }
    }).sort({ name: 1 });
    res.json(states);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching states', error: err });
  }
});

// GET districts by state
router.get('/districts', async (req: Request, res: Response) => {
  try {
    const { stateId } = req.query;
    const districts = await District.find({
      state_id: stateId,
      District: { $exists: true, $nin: [null, ""] }
    }).sort({ name: 1 });
    res.json(districts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching districts', error: err });
  }
});

// GET blocks by district
router.get('/blocks', async (req: Request, res: Response) => {
  try {
    const { districtId } = req.query;
    const blocks = await Taluks.find({ district_id: districtId,
    Taluk: { $exists: true, $nin: [null, ""] }
     }).sort({ name: 1 });
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching blocks', error: err });
  }
});

// GET pincodes by block
router.get('/pincodes', async (req: Request, res: Response) => {
  try {
    const { talukId } = req.query;
    const pincodes = await Pincode.find({ taluk_id: talukId,
    Pincode: { $exists: true, $nin: [null, ""] }
     }).sort({ code: 1 });
    res.json(pincodes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pincodes', error: err });
  }
});


export default router;
