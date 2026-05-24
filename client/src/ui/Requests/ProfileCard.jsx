import { formatDate } from "../../lib/formatDate";

const ProfileCard = ({
  profile,
  type = "user",
  className = "",
  additionalInfo = null,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 p-5 ${className}`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
        {type}
      </p>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
          <img
            src={profile.avatar || `/${type}.jpg`}
            alt={profile.name || type}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-800 truncate">
            {profile.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
          {profile.location && (
            <p className="text-sm text-gray-600 mt-2">
              <span className="text-gray-500">Location:</span>{" "}
              <span className="font-medium">{profile.location}</span>
            </p>
          )}
          {profile.dateJoined && (
            <p className="text-sm text-gray-600 mt-1">
              <span className="text-gray-500">Joined:</span>{" "}
              <span className="font-medium">
                {formatDate(profile.dateJoined)}
              </span>
            </p>
          )}
          {additionalInfo && <div className="mt-3">{additionalInfo}</div>}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
