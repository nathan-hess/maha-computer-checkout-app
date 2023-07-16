import { ROLES } from '../../constants.js';


/**
 * Returns whether a user's role is considered an "internal" organization member
 *
 * @param role A `string` containing the user's role
 */
export function isInternalMember(role) {
    return (role === ROLES.admin) || (role === ROLES.faculty)
            || (role === ROLES.student);
}
