import { SouthPay } from "./client";
import { SouthpayError, isSouthpayError } from "./errors";
import { VERSION } from "./version";

Object.assign(SouthPay, { SouthpayError, isSouthpayError, VERSION });

export default SouthPay;
