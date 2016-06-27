/**
 * Returns an array of an object's own property keys that are
 * not prefixed with `_`, indicating pseudo-privacy.
 *
 * @param {Object} instance
 * @return {Array<string>} Public members
 */
export default function getPublicMemberKeys(instance) {
  return Object.keys(instance).filter(k => k[0] !== '_');
}
