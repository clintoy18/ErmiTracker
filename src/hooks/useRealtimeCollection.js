import { useEffect, useState } from "react";

export function useRealtimeCollection(subscribeFn, options) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeFn(
      options,
      (data) => {
        setItems(data);
        setLoading(false);
      },
      (subscriptionError) => {
        setError(subscriptionError.message || "Unable to load data.");
        setLoading(false);
      },
    );

    return () => unsubscribe?.();
  }, [options, subscribeFn]);

  return { items, loading, error };
}
