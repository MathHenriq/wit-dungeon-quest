-- Fix permissive INSERT policy for student_requests
-- Make it more specific: require valid student_id that exists

DROP POLICY IF EXISTS "Anyone can insert requests" ON public.student_requests;

-- Only allow insert if the student_id exists in students table
CREATE POLICY "Allow insert requests for existing students" ON public.student_requests
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.students WHERE id = student_id)
    );

-- Create trigger to auto-create teacher profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has teacher role in metadata
    IF NEW.raw_user_meta_data->>'role' = 'teacher' THEN
        INSERT INTO public.teachers (user_id, name)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();