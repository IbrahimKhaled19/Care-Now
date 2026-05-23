import { memo } from "react";
import { Star } from "lucide-react";

const defaultData = [
  {
    provider: "Emily Carter",
    rating: 4.9,
    requests: 1290,
  },
  {
    provider: "Sarah Johnson",
    rating: 4.8,
    requests: 1250,
  },
  {
    provider: "Michael Chen",
    rating: 4.7,
    requests: 1203,
  },
];

const TopProviders = memo(({ data = defaultData }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Provider
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rating
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Requests
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors duration-100"
            >
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-semibold">
                    {item.provider.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {item.provider}
                  </span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm text-gray-700">{item.rating}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right text-sm text-gray-700">
                {item.requests.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default TopProviders;
