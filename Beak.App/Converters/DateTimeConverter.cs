using System;
using System.Globalization;
using System.Windows.Data;

namespace Beak.App.Converters
{
	public class DateTimeConverter : IValueConverter
	{
		public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
		{
			var datetime = (DateTime)value;

			return datetime.ToString(parameter as string);
		}
		public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
		{
			return null;
		}
	}
}
