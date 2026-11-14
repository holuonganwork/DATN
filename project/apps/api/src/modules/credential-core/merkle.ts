import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { keccak256Utf8 } from "./digest";
import { CredentialAnchor, normalizeAddress, normalizeText } from "./payload";

export const LEAF_ENCODING = ["uint256", "address", "string", "string", "bytes32"] as const;

export type LeafTuple = [number, string, string, string, string];

export interface MerkleLeafInput {
  key: string;
  anchor: CredentialAnchor;
  payloadDigest: string;
}

export interface BuiltMerkleTree {
  root: string;
  leaves: Record<string, string>;
  proofs: Record<string, string[]>;
}

export const toLeafTuple = (anchor: CredentialAnchor, payloadDigest: string): LeafTuple => [
  anchor.chainId,
  normalizeAddress(anchor.registryAddress),
  normalizeText(anchor.issuerId),
  normalizeText(anchor.batchId),
  normalizeAddress(payloadDigest),
];

export const computeLeafHash = (anchor: CredentialAnchor, payloadDigest: string): string => {
  const tuple = toLeafTuple(anchor, payloadDigest);
  const tree = StandardMerkleTree.of([tuple], [...LEAF_ENCODING]);
  return tree.leafHash(tuple).toLowerCase();
};

export const buildMerkleTree = (items: MerkleLeafInput[]): BuiltMerkleTree => {
  if (items.length === 0) {
    return {
      root: keccak256Utf8("EMPTY_MERKLE_TREE"),
      leaves: {},
      proofs: {},
    };
  }

  const tuples = items.map((item) => toLeafTuple(item.anchor, item.payloadDigest));
  const tree = StandardMerkleTree.of(tuples, [...LEAF_ENCODING]);

  const leaves: Record<string, string> = {};
  const proofs: Record<string, string[]> = {};

  items.forEach((item, index) => {
    const tuple = tuples[index];
    leaves[item.key] = tree.leafHash(tuple).toLowerCase();
    proofs[item.key] = tree.getProof(index).map((node) => node.toLowerCase());
  });

  return {
    root: tree.root.toLowerCase(),
    leaves,
    proofs,
  };
};

export const verifyMerkleProof = (
  anchor: CredentialAnchor,
  payloadDigest: string,
  proofPath: string[],
  expectedRoot: string,
  expectedLeaf?: string,
): boolean => {
  try {
    const tuple = toLeafTuple(anchor, payloadDigest);
    if (expectedLeaf) {
      const computedLeaf = computeLeafHash(anchor, payloadDigest);
      if (computedLeaf !== normalizeAddress(expectedLeaf)) {
        return false;
      }
    }
    return StandardMerkleTree.verify(
      normalizeAddress(expectedRoot),
      [...LEAF_ENCODING],
      tuple,
      proofPath.map(normalizeAddress),
    );
  } catch {
    return false;
  }
};
