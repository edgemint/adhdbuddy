-- Matching queue table for real-time user matching
-- Users wait in this queue until matched with a partner

CREATE TABLE matching_queue (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  duration INT NOT NULL CHECK (duration IN (25, 50, 75)),
  start_time TIMESTAMPTZ NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  timezone TEXT,
  preferred_partner_ids UUID[]
);

-- Indexes for efficient matching queries
CREATE INDEX idx_matching_queue_duration ON matching_queue(duration);
CREATE INDEX idx_matching_queue_start_time ON matching_queue(start_time);
CREATE INDEX idx_matching_queue_requested_at ON matching_queue(requested_at);

-- Enable RLS
ALTER TABLE matching_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for matching_queue
CREATE POLICY "Users can view all queue entries"
  ON matching_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add themselves to queue"
  ON matching_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue entry"
  ON matching_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves from queue"
  ON matching_queue FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage all queue entries (for edge functions)
CREATE POLICY "Service role can manage queue"
  ON matching_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to clean up stale queue entries (older than 10 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM matching_queue
  WHERE requested_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE matching_queue IS 'Temporary queue for users waiting to be matched with accountability partners';
