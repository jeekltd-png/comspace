import { RequestHandler } from 'express';
import axios from 'axios';
import { redisClient } from '../server';
import { CustomError } from '../middleware/error.middleware';

export const getExchangeRates: RequestHandler = async (req, res, next) => {
  try {
    const { base = 'USD' } = req.query;

    const cacheKey = `rates:${base}`;
    let cached: string | null = null;
    try {
      if (redisClient) cached = await redisClient.get(cacheKey);
    } catch (_) { /* Redis unavailable, skip cache */ }

    if (cached) {
      return res.status(200).json({
        success: true,
        data: JSON.parse(cached),
      });
    }

    const response = await axios.get(
      `${process.env.CURRENCY_API_URL}/${process.env.CURRENCY_API_KEY}/latest/${base}`,
      { timeout: 5000 }
    );

    const data = {
      base: response.data.base_code,
      rates: response.data.conversion_rates,
      timestamp: response.data.time_last_update_unix,
    };

    try {
      if (redisClient) await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
    } catch (_) { /* Redis unavailable */ }

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
    let rate: string | null = null;
    try {
      if (redisClient) rate = await redisClient.get(cacheKey);
    } catch (_) { /* Redis unavailable */ }

    if (!rate) {
      const response = await axios.get(
        `${process.env.CURRENCY_API_URL}/${process.env.CURRENCY_API_KEY}/pair/${from}/${to}`,
        { timeout: 5000 }
      );

      rate = response.data.conversion_rate.toString();
      try {
        if (redisClient) await redisClient.setEx(cacheKey, 3600, rate as string);
      } catch (_) { /* Redis unavailable */ }
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
