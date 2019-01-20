//Search for each embed tag
jQuery('embed').each(function() {
	//Only add type attribute when it is not set
	if (typeof jQuery(this).attr("type") == 'undefined')
	{
		jQuery(this).attr("type", "application/x-shockwave-flash");
		//Add a temporary wrapper to proper reload the content
		jQuery(this).wrap('<div id="ff-wrapper">');
		//Reload flash
		jQuery(this).parent().replaceWith(jQuery(this).clone());
	}
}
);
