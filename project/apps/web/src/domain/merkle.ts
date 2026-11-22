import { computeDigestHex, normalizeAddress } from "./crypto";

export const hashMerklePair = (left: string, right: string): string => {
  const a = normalizeAddress(left);
  const b = normalizeAddress(right);
  const ordered = a <= b ? `${a}:${b}` : `${b}:${a}`;
  return computeDigestHex(`MERKLE_NODE:${ordered}`, 64);
};

export const buildMerkleTree = (
  leaves: string[],
): { root: string; proofs: Record<string, string[]> } => {
  if (leaves.length === 0) {
    return { root: computeDigestHex("EMPTY_MERKLE_TREE", 64), proofs: {} };
  }
  const uniqueLeaves = [...leaves];
  const proofs: Record<string, string[]> = {};
  for (const leaf of uniqueLeaves) {
    proofs[leaf] = [];
  }

  let currentLayer = uniqueLeaves.map((leaf) => ({
    hash: leaf,
    members: [leaf],
  }));

  while (currentLayer.length > 1) {
    const nextLayer: { hash: string; members: string[] }[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const leftNode = currentLayer[i];
      const rightNode = currentLayer[i + 1];
      if (!rightNode) {
        nextLayer.push(leftNode);
        continue;
      }
      for (const member of leftNode.members) {
        proofs[member] = [...(proofs[member] ?? []), rightNode.hash];
      }
      for (const member of rightNode.members) {
        proofs[member] = [...(proofs[member] ?? []), leftNode.hash];
      }
      nextLayer.push({
        hash: hashMerklePair(leftNode.hash, rightNode.hash),
        members: [...leftNode.members, ...rightNode.members],
      });
    }
    currentLayer = nextLayer;
  }

  return {
    root: currentLayer[0].hash,
    proofs,
  };
};

export const verifyMerkleProof = (
  leaf: string,
  path: string[],
  expectedRoot: string,
): boolean => {
  let computed = normalizeAddress(leaf);
  for (const sibling of path) {
    computed = normalizeAddress(hashMerklePair(computed, sibling));
  }
  return computed === normalizeAddress(expectedRoot);
};
