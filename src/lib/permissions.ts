export function getPermissions(userProfile: any) {
  const isApproved = userProfile?.status === "approved";
  const isAdmin = userProfile?.role === "admin" && isApproved;
  const isCR = userProfile?.role === "cr" && isApproved;
  
  return {
    isApproved,
    isAdmin,
    isCR,
    canManageShared: isAdmin || isCR,
    canManageUsers: isAdmin
  };
}
