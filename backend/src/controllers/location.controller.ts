import { RequestHandler } from 'express';
import axios from 'axios';
import Store from '../models/store.model';
import { AuthRequest } from '../middleware/auth.middleware';
export const detectLocation: RequestHandler = async (req, res, next) => {
  try {
    const { ip } = req.body;

    // Use IP geolocation service
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);

    res.status(200).json({
      success: true,
      data: {
        country: response.data.country_name,
        countryCode: response.data.country_code,
        city: response.data.city,
        currency: response.data.currency,
        coordinates: {
          lat: response.data.latitude,
          lng: response.data.longitude,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getNearbyStores: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { lat, lng, radius = 10000 } = req.query; // radius in meters

    const stores = await Store.find({
      tenant: authReq.tenant,
      isActive: true,
      coordinates: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(radius),
        },
      },
    });

    res.status(200).json({ success: true, data: { stores } });
  } catch (error) {
    next(error);
  }
};

export const validateAddress: RequestHandler = async (req, res, next) => {
  try {
    const { address } = req.body;

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (response.data.results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address',
      });
    }

    const result = response.data.results[0];

    res.status(200).json({
      success: true,
      data: {
        formattedAddress: result.formatted_address,
        coordinates: result.geometry.location,
        components: result.address_components,
      },
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
};
