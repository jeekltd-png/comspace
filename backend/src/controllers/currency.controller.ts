import { RequestHandler } from 'express';
import axios from 'axios';
import { redisClient } from '../server';
import { CustomError } from '../middleware/error.middleware';

export const getExchangeRates: RequestHandler = async (req, res, next) => {
  try {
    const { base = 'USD' } = req.query;

    // Check cache first
    const cacheKey = `rates:${base}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return res.status(200).json({
        success: true,
        data: JSON.parse(cached),
      });
    }

    // Fetch from API
    const response = await axios.get(
      `${process.env.CURRENCY_API_URL}/${process.env.CURRENCY_API_KEY}/latest/${base}`
    );

    const data = {
      base: response.data.base_code,
      rates: response.data.conversion_rates,
      timestamp: response.data.time_last_update_unix,
    };

    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));

    res.status(200).json({
      success: true,
      data,
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
};

export const convertCurrency: RequestHandler = async (req, res, next) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      return next(new CustomError('Amount, from, and to currencies are required', 400));
    }

    const cacheKey = `convert:${from}:${to}`;
    let rate = (await redisClient.get(cacheKey)) as string | null;

    if (!rate) {
      const response = await axios.get(
        `${process.env.CURRENCY_API_URL}/${process.env.CURRENCY_API_KEY}/pair/${from}/${to}`
      );

      rate = response.data.conversion_rate.toString();
      await redisClient.setEx(cacheKey, 3600, rate as string);
    }

    const rateFloat = parseFloat(rate as string);
    const convertedAmount = Number(amount) * rateFloat;

    res.status(200).json({
      success: true,
      data: {
        amount,
        from,
        to,
        rate: rateFloat,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
      },
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
};
