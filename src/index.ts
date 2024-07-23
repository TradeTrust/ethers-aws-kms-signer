import { arrayify, Bytes, joinSignature } from "@ethersproject/bytes";
import { Signer } from "@ethersproject/abstract-signer";
import { Provider, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable, defineReadOnly, resolveProperties } from "@ethersproject/properties";
import { keccak256 } from "@ethersproject/keccak256";
import { serialize as serializeTransaction, UnsignedTransaction } from "@ethersproject/transactions";

import { hashMessage } from "@ethersproject/hash";
import { getPublicKey, getEthereumAddress, requestKmsSignature, determineCorrectV } from "./util/aws-kms-utils";

export interface AwsKmsSignerCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  region: string;
  keyId: string;
}
export class AwsKmsSigner extends Signer {
  kmsCredentials: AwsKmsSignerCredentials;

  ethereumAddress: string;

  constructor(kmsCredentials: AwsKmsSignerCredentials, provider?: Provider) {
    super();
    defineReadOnly(this, "provider", provider || null);
    defineReadOnly(this, "kmsCredentials", kmsCredentials);
  }

  async getAddress(): Promise<string> {
    if (this.ethereumAddress === undefined) {
      const key = await getPublicKey(this.kmsCredentials);
      this.ethereumAddress = getEthereumAddress(Buffer.from(key.PublicKey));
    }
    return Promise.resolve(this.ethereumAddress);
  }

  async _signDigest(digestString: string): Promise<string> {
    const digestBuffer = Buffer.from(arrayify(digestString));
    const sig = await requestKmsSignature(digestBuffer, this.kmsCredentials);
    const ethAddr = await this.getAddress();
    const { v } = determineCorrectV(digestBuffer, sig.r, sig.s, ethAddr);
    return joinSignature({
      v,
      r: `0x${sig.r.toString("hex")}`,
      s: `0x${sig.s.toString("hex")}`,
    });
  }

  async signMessage(message: string | Bytes): Promise<string> {
    return this._signDigest(hashMessage(message));
  }

  async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    const unsignedTx = await resolveProperties(transaction);
    const serializedTx = serializeTransaction(<UnsignedTransaction>unsignedTx);
    const transactionSignature = await this._signDigest(keccak256(serializedTx));
    return serializeTransaction(<UnsignedTransaction>unsignedTx, transactionSignature);
  }

  connect(provider: Provider): AwsKmsSigner {
    return new AwsKmsSigner(this.kmsCredentials, provider);
  }
}
